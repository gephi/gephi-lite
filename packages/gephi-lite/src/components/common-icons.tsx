import { FieldModelType } from "@gephi/gephi-lite-sdk";
import { IconType } from "react-icons";
import {
  Bs123,
  BsAlphabetUppercase,
  BsBodyText,
  BsCalendar3,
  BsCircle,
  BsCodeSlash,
  BsExclamationTriangle,
  BsFillPlayFill,
  BsFillTagsFill,
  BsGithub,
  BsSlashLg,
} from "react-icons/bs";
import { GrOverview } from "react-icons/gr";
import { ImFilesEmpty } from "react-icons/im";
import { MdLogin, MdLogout, MdOutlineRefresh, MdOutlineSaveAlt } from "react-icons/md";
import {
  PiArrowSquareOut,
  PiCaretDown,
  PiCaretLeft,
  PiCaretRight,
  PiCaretUp,
  PiChartBar,
  PiCheck,
  PiCircleHalf,
  PiCircleHalfFill,
  PiFunnel,
  PiGear,
  PiGraph,
  PiGraphFill,
  PiMagnifyingGlass,
  PiMoonStars,
  PiMoonStarsFill,
  PiPalette,
  PiPolygon,
  PiSun,
  PiSunFill,
  PiTable,
  PiTableFill,
  PiX,
} from "react-icons/pi";

import { ItemType } from "../core/types";

export const GraphIcon = PiGraph;
export const GraphIconFill = PiGraphFill;
export const DataLaboratoryIcon = PiTable;
export const DataLaboratoryIconFill = PiTableFill;
export const CaretDownIcon = PiCaretDown;
export const CaretUpIcon = PiCaretUp;
export const CaretLeftIcon = PiCaretLeft;
export const CaretRightIcon = PiCaretRight;
export const AppearanceIcon = PiPalette;
export const FiltersIcon = PiFunnel;
export const StatisticsIcon = PiChartBar;
export const LayoutsIcon = PiPolygon;
export const ExternalLink = PiArrowSquareOut;

export const FileIcon = ImFilesEmpty;
export const GitHubIcon = BsGithub;
export const SingInIcon = MdLogin;
export const SignOutIcon = MdLogout;
export const ContextIcon = GrOverview;
export const RetryIcon = MdOutlineRefresh;
export const SettingsIcon = PiGear;
export const DangerIcon = BsExclamationTriangle;

export const NodeIcon = BsCircle;
export const EdgeIcon = BsSlashLg;
export const ItemIcons: Record<ItemType, IconType> = {
  nodes: NodeIcon,
  edges: EdgeIcon,
};

export const CodeEditorIcon = BsCodeSlash;
export const SaveIcon = MdOutlineSaveAlt;
export const RunIcon = BsFillPlayFill;
export const CloseIcon = PiX;
export const SearchIcon = PiMagnifyingGlass;
export const CheckedIcon = PiCheck;
export const DarkThemeIcon = PiMoonStars;
export const DarkThemeSelectedIcon = PiMoonStarsFill;
export const LightThemeIcon = PiSun;
export const LightThemeSelectedIcon = PiSunFill;
export const AutoThemeIcon = PiCircleHalf;
export const AutoThemeSelectedIcon = PiCircleHalfFill;

export const FieldModelIcons: Record<FieldModelType, IconType> = {
  text: BsBodyText,
  number: Bs123,
  category: BsAlphabetUppercase,
  keywords: BsFillTagsFill,
  date: BsCalendar3,
};
