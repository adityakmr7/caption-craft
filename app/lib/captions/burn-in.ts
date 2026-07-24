import { spawn } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { getCaptionStyle } from "./styles";
import { groupWords, type TimedWord } from "./group-words";
import { renderCaptionImage, CANVAS_WIDTH, CANVAS_HEIGHT } from "./render-text-image";

export interface BurnInResult {
  outputPath: string;
  captionCount: number;
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args);
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}\n${stderr.slice(-4000)}`));
      }
    });
  });
}

/**
 * Burns styled, timed captions into a video. Renders each caption as a
 * transparent PNG (via canvas, not ffmpeg drawtext - see styles.ts) and
 * composites them with ffmpeg's overlay filter, timed with enable=between().
 */
export async function burnInCaptions(
  inputVideoPath: string,
  words: TimedWord[],
  styleId: string
): Promise<BurnInResult> {
  const style = getCaptionStyle(styleId);

  const segments =
    style.mode === "word"
      ? words.map((w) => ({ text: w.text, start: w.start, end: w.end }))
      : groupWords(words).map((g) => ({ text: g.text, start: g.start, end: g.end }));

  if (segments.length === 0) {
    throw new Error("No caption segments to burn in - empty transcript");
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "captioncraft-"));
  const outputPath = path.join(workDir, "output.mp4");
  const filterScriptPath = path.join(workDir, "filter.txt");

  try {
    const imagePaths: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      const buffer = renderCaptionImage(segments[i].text, style);
      const imagePath = path.join(workDir, `cap-${i}.png`);
      await writeFile(imagePath, buffer);
      imagePaths.push(imagePath);
    }

    const filterLines: string[] = [
      `[0:v]scale=${CANVAS_WIDTH}:${CANVAS_HEIGHT}:force_original_aspect_ratio=increase,crop=${CANVAS_WIDTH}:${CANVAS_HEIGHT}[base]`,
    ];

    let prevLabel = "base";
    segments.forEach((seg, i) => {
      const inputIndex = i + 1; // input 0 is the source video
      const outLabel = i === segments.length - 1 ? "vout" : `v${i}`;
      filterLines.push(
        `[${prevLabel}][${inputIndex}:v]overlay=0:0:enable='between(t,${seg.start.toFixed(3)},${seg.end.toFixed(3)})'[${outLabel}]`
      );
      prevLabel = outLabel;
    });

    await writeFile(filterScriptPath, filterLines.join(";\n"));

    const args = [
      "-y",
      "-i",
      inputVideoPath,
      ...imagePaths.flatMap((p) => ["-i", p]),
      "-filter_complex_script",
      filterScriptPath,
      "-map",
      "[vout]",
      "-map",
      "0:a?",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-shortest",
      outputPath,
    ];

    await runFfmpeg(args);

    return { outputPath, captionCount: segments.length };
  } catch (err) {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
    throw err;
  }
}
