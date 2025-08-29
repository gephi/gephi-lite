import { FieldModelType } from "@gephi/gephi-lite-sdk";
import { FC } from "react";
import { IconType } from "react-icons";
import { BsTags } from "react-icons/bs";
import { IconBaseProps } from "react-icons/lib/iconBase";
import {
  PiArrowClockwise,
  PiArrowCounterClockwise,
  PiArrowSquareOut,
  PiArrowsClockwise,
  PiArrowsInSimple,
  PiBinary,
  PiBinaryBold,
  PiBug,
  PiCalendarDots,
  PiCaretDown,
  PiCaretLeft,
  PiCaretRight,
  PiCaretUp,
  PiChartBar,
  PiCheck,
  PiCheckCircle,
  PiCheckSquare,
  PiCircleHalf,
  PiCircleHalfFill,
  PiCirclesFour,
  PiCirclesThree,
  PiClipboard,
  PiCode,
  PiCornersIn,
  PiCornersOut,
  PiCrosshair,
  PiCursor,
  PiCursorFill,
  PiDotsThreeVerticalBold,
  PiDownload,
  PiFunnel,
  PiFunnelFill,
  PiGear,
  PiGithubLogo,
  PiGps,
  PiGraph,
  PiGraphFill,
  PiHouseLine,
  PiInfo,
  PiLasso,
  PiLassoBold,
  PiLineSegment,
  PiLink,
  PiLock,
  PiMagicWand,
  PiMagnifyingGlass,
  PiMagnifyingGlassMinus,
  PiMagnifyingGlassPlus,
  PiMoonStars,
  PiMoonStarsFill,
  PiPaintBrush,
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
  PiQuestion,
  PiSelection,
  PiSelectionBold,
  PiSignIn,
  PiSpinner,
  PiSquare,
  PiStop,
  PiStopFill,
  PiSun,
  PiSunFill,
  PiTable,
  PiTableFill,
  PiTextT,
  PiTrash,
  PiUser,
  PiWarning,
  PiWarningCircle,
  PiWarningOctagon,
  PiX,
} from "react-icons/pi";

import { GraphSelectionMode } from "../core/selection/types";
import { ItemType } from "../core/types";

export const AppearanceIcon = PiPalette;
export const AppearanceIconFill = PiPaletteFill;
export const AutoThemeIcon = PiCircleHalf;
export const AutoThemeSelectedIcon = PiCircleHalfFill;
export const BugIcon = PiBug;
export const CancelIcon = PiX;
export const CaptionClose = PiArrowsInSimple;
export const CaptionOpen = PiQuestion;
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
export const DownloadIcon = PiDownload;
export const EditIcon = PiPencilSimpleLine;
export const EditIconFill = PiPencilSimpleLineFill;
export const ExitFullScreenIcon = PiCornersIn;
export const ExternalLinkIcon = PiArrowSquareOut;
export const FilterAddIcon = PiPlusCircle;
export const FilterDeleteIcon = PiTrash;
export const FilterEnabledIcon = PiCheckSquare;
export const FilterDisabledIcon = PiSquare;
export const FiltersIcon = PiFunnel;
export const FiltersIconFill = PiFunnelFill;
export const FullScreenIcon = PiCornersOut;
export const GitHubIcon = PiGithubLogo;
export const GraphIcon = PiGraph;
export const GraphIconFill = PiGraphFill;
export const GuessSettingsIcon = PiMagicWand;
export const HomeIcon = PiHouseLine;
export const InvalidDataIcon = PiWarningCircle;
export const LassoIcon = PiLasso;
export const LassoIconFill = PiLassoBold;
export const LayoutsIcon = PiPolygon;
export const LayoutsIconFill = PiPolygonFill;
export const LightThemeIcon = PiSun;
export const LightThemeSelectedIcon = PiSunFill;
export const LockIcon = PiLock;
export const LoginIcon = PiSignIn;
export const MarqueeIcon = PiSelection;
export const MarqueeIconFill = PiSelectionBold;
export const MenuCollapseIcon = PiCaretDown;
export const MenuExpandIcon = PiCaretUp;
export const MenuPreviousIcon = PiCaretLeft;
export const MetricsIcon = PiBinary;
export const MetricsIconFill = PiBinaryBold;
export const MouseIcon = PiCursor;
export const MouseIconFill = PiCursorFill;
export const OpenInGraphIcon = PiCrosshair;
export const PlayIcon = PiPlay;
export const PlayIconFill = PiPlayFill;
export const ResetIcon = PiArrowCounterClockwise;
export const RetryIcon = PiArrowClockwise;
export const SearchIcon = PiMagnifyingGlass;
export const SettingsIcon = PiGear;
export const StopIcon = PiStop;
export const StopIconFill = PiStopFill;
export const SyncIcon = PiArrowsClockwise;
export const ThreeDotsVerticalIcon = PiDotsThreeVerticalBold;
export const TrashIcon = PiTrash;
export const UnselectAllIcon = PiSpinner;
export const UserIcon = PiUser;
export const ZoomInIcon = PiMagnifyingGlassPlus;
export const ZoomOutIcon = PiMagnifyingGlassMinus;
export const ZoomResetIcon = PiGps;

export const GraphSelectionModeIcons: Record<GraphSelectionMode, { normal: IconType; fill: IconType }> = {
  cursor: { normal: MouseIcon, fill: MouseIconFill },
  marquee: { normal: MarqueeIcon, fill: MarqueeIconFill },
  lasso: { normal: LassoIcon, fill: LassoIconFill },
};
export const GraphSelectionModeIcon: FC<{ mode: GraphSelectionMode; fill?: boolean; className?: string }> = ({
  mode,
  fill,
  className,
}) => {
  const Icon = GraphSelectionModeIcons[mode][fill ? "fill" : "normal"];
  return <Icon className={className} />;
};

// Need to be replace by PI icons
export const NodeIcon = PiCirclesThree;
export const EdgeIcon = PiLineSegment;
export const ItemIcons: Record<ItemType, IconType> = {
  nodes: NodeIcon,
  edges: EdgeIcon,
};
export const ItemTypeIcon: FC<IconBaseProps & { type: ItemType }> = ({ type, ...props }) => {
  const Icon = ItemIcons[type];
  if (!Icon) {
    console.error(`Field model type "${type}" is not recognized.`);
    return null;
  }
  return <Icon {...props} />;
};

export const FieldModelIcons: Record<FieldModelType, IconType> = {
  text: PiTextT,
  url: PiLink,
  number: PiChartBar,
  category: PiCirclesFour,
  // Still in Bs consciously, the style difference isn't to contrasted
  keywords: BsTags,
  date: PiCalendarDots,
  color: PiPaintBrush,
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
