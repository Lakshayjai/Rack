import type { Category, ExtractionCandidate } from "shared-types";

/** One extraction candidate plus its editable review state. */
export interface CandidateState extends ExtractionCandidate {
  /** Stable key for React lists and refine targeting (index at load time). */
  key: number;
  /** Category the item will be saved with (user can override the suggestion). */
  category: Category;
  /** Whether this cutout will be saved. */
  selected: boolean;
  /** Whether the user hand-edited the mask in the MaskEditor. */
  refined: boolean;
}

/** Human labels for the extraction classes. */
export const LABEL_TEXT: Record<ExtractionCandidate["label"], string> = {
  upper: "Upper garment",
  lower: "Lower garment",
  full: "Full-body",
  item: "Whole item",
};

/** Metadata collected in the details step, shared by all cutouts being saved. */
export interface ItemDetailsForm {
  category: Category | null;
  subtype: string | null;
  /** Ethnic / Indian Wear picker mode: choose a garment first, category follows. */
  ethnicMode: boolean;
  colors: string[];
  styles: string[];
  occasions: string[];
  brand: string;
  notes: string;
}

export const EMPTY_DETAILS: ItemDetailsForm = {
  category: null,
  subtype: null,
  ethnicMode: false,
  colors: [],
  styles: [],
  occasions: [],
  brand: "",
  notes: "",
};
