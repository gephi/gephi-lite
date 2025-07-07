import { FieldModelType } from "@gephi/gephi-lite-sdk";
import { FC } from "react";
import { IconType } from "react-icons";
import {
  Bs123,
  BsAlphabetUppercase,
  BsBodyText,
  BsCalendar3,
  BsCircle,
  BsFillTagsFill,
  BsSlashLg,
} from "react-icons/bs";
import { IconBaseProps } from "react-icons/lib/iconBase";
import {
  PiArrowClockwise,
  PiArrowCounterClockwise,
  PiArrowSquareOut,
  PiArrowsIn,
  PiArrowsOut,
  PiCaretDown,
  PiCaretLeft,
  PiCaretRight,
  PiCaretUp,
  PiChartBar,
  PiChartBarFill,
  PiCheck,
  PiCheckCircle,
  PiCircleHalf,
  PiCircleHalfFill,
  PiClipboard,
  PiCode,
  PiDotsThreeVertical,
  PiFunnel,
  PiFunnelFill,
  PiGear,
  PiGithubLogo,
  PiGpsFix,
  PiGraph,
  PiGraphFill,
  PiInfo,
  PiMagicWand,
  PiMagnifyingGlass,
  PiMagnifyingGlassMinus,
  PiMagnifyingGlassPlus,
  PiMoonStars,
  PiMoonStarsFill,
  PiPalette,
  PiPaletteFill,
  PiPencilSimpleLine,
  PiPencilSimpleLineFill,
  PiPlay,
  PiPlayFill,
  PiPlusCircle,
  PiPlusCircleFill,
  PiPolygon,
  PiPolygonFill,
  PiStop,
  PiStopFill,
  PiSun,
  PiSunFill,
  PiTable,
  PiTableFill,
  PiTrash,
  PiUser,
  PiWarning,
  PiWarningOctagon,
  PiX,
} from "react-icons/pi";

import { ItemType } from "../core/types";

export const AppearanceIcon = PiPalette;
export const AppearanceIconFill = PiPaletteFill;
export const AutoThemeIcon = PiCircleHalf;
export const AutoThemeSelectedIcon = PiCircleHalfFill;
export const CancelIcon = PiX;
export const CaretDownIcon = PiCaretDown;
export const CaretLeftIcon = PiCaretLeft;
export const CaretRightIcon = PiCaretRight;
export const CaretUpIcon = PiCaretUp;
export const CheckedIcon = PiCheck;
export const ClipboardIcon = PiClipboard;
export const CloseIcon = PiX;
export const CodeEditorIcon = PiCode;
export const DarkThemeIcon = PiMoonStars;
export const DarkThemeSelectedIcon = PiMoonStarsFill;
export const DataCreationIcon = PiPlusCircle;
export const DataCreationIconFill = PiPlusCircleFill;
export const DataIcon = PiTable;
export const DataIconFill = PiTableFill;
export const ExternalLinkIcon = PiArrowSquareOut;
export const EditIcon = PiPencilSimpleLine;
export const EditIconFill = PiPencilSimpleLineFill;
export const ExitFullScreenIcon = PiArrowsIn;
export const FiltersIcon = PiFunnel;
export const FiltersIconFill = PiFunnelFill;
export const FullScreenIcon = PiArrowsOut;
export const GraphIcon = PiGraph;
export const GraphIconFill = PiGraphFill;
export const GitHubIcon = PiGithubLogo;
export const GuessSettingsIcon = PiMagicWand;
export const LayoutsIcon = PiPolygon;
export const LayoutsIconFill = PiPolygonFill;
export const LightThemeIcon = PiSun;
export const LightThemeSelectedIcon = PiSunFill;
export const LocateIcon = PiGpsFix;
export const ResetIcon = PiArrowCounterClockwise;
export const SettingsIcon = PiGear;
export const PlayIcon = PiPlay;
export const PlayIconFill = PiPlayFill;
export const RetryIcon = PiArrowClockwise;
export const SearchIcon = PiMagnifyingGlass;
export const StatisticsIcon = PiChartBar;
export const StatisticsIconFill = PiChartBarFill;
export const ThreeDotsVerticalIcon = PiDotsThreeVertical;
export const TrashIcon = PiTrash;
export const UserIcon = PiUser;
export const StopIcon = PiStop;
export const StopIconFill = PiStopFill;
export const ZoomInIcon = PiMagnifyingGlassPlus;
export const ZoomOutIcon = PiMagnifyingGlassMinus;
export const ZoomResetIcon = PiArrowCounterClockwise;

// Need to be replace by PI icons
export const NodeIcon = BsCircle;
export const EdgeIcon = BsSlashLg;
export const ItemIcons: Record<ItemType, IconType> = {
  nodes: NodeIcon,
  edges: EdgeIcon,
};

export const FieldModelIcons: Record<FieldModelType, IconType> = {
  text: BsBodyText,
  number: Bs123,
  category: BsAlphabetUppercase,
  keywords: BsFillTagsFill,
  date: BsCalendar3,
};
export const FieldModelIcon: FC<IconBaseProps & { type: FieldModelType }> = ({ type, ...props }) => {
  const Icon = FieldModelIcons[type];
  if (!Icon) {
    console.error(`Field model type "${type}" is not recognized.`);
    return null;
  }
  return <Icon {...props} />;
};

export const STATUS_ICONS = {
  success: PiCheckCircle,
  info: PiInfo,
  warning: PiWarning,
  error: PiWarningOctagon,
} as const;
