import { LevelCurveTutor } from "../modules/LevelCurveTutor";
import { LevelCurveCat } from "../modules/LevelCurveCat";

export function getTutorLevelFromXpt(xpt: number): number {
  let level = 1;

  for (const [lvl, required] of Object.entries(LevelCurveTutor)) {
    if (xpt >= required) level = Number(lvl);
  }

  return level;
}

export function getCatLevelFromXpg(xpg: number): number {
  let level = 1;

  for (const [lvl, required] of Object.entries(LevelCurveCat)) {
    if (xpg >= required) level = Number(lvl);
  }

  return level;
}

export function getNextTutorLevelTarget(level: number): number | null {
  return LevelCurveTutor[level + 1] ?? null;
}

export function getNextCatLevelTarget(level: number): number | null {
  return LevelCurveCat[level + 1] ?? null;
}