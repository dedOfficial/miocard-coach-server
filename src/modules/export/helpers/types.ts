export type ResultStat = {
  clientNumber: string;
  day: string;
  time: string;
};

export type ExportPdfFood = ResultStat & { food?: string };
export type ExportPdfRecommendation = ResultStat & {
  repeatability?: number | string;
  recommendationTitle?: string[];
};
export type ExportPdfDrug = ResultStat & { drug?: string };
export type ExportPdfWeight = ResultStat & { weight?: number | string };
export type ExportPdfWalkedDistance = ResultStat & {
  walkedDistance?: number | string;
};
export type ExportPdfMood = ResultStat & { mood?: string };
export type ExportPdfCardio = ResultStat & {
  pressure?: string;
  pulse?: number | string;
  timeOfDay?: string;
};
export type ExportPdfHabit = ResultStat & {
  habitId?: string;
  habit?: string;
  repeatability?: number;
};
export type ExportPdfSymptom = ResultStat & {
  symptom?:
    | string
    | {
        cardiovascular: string[];
        nonCardiovascular: string;
        isAbsent: boolean;
      };
};
export type ExportPdfCheckin = ResultStat & {
  checkin?: Array<string> | string;
};

export type ResultPdfStat =
  | ExportPdfFood
  | ExportPdfDrug
  | ExportPdfSymptom
  | ExportPdfWeight
  | ExportPdfWalkedDistance
  | ExportPdfCardio
  | ExportPdfMood
  | ExportPdfHabit
  | ExportPdfCheckin;
