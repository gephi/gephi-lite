import { FieldModelType } from "@gephi/gephi-lite-sdk";
import { FC } from "react";
import { IconType } from "react-icons";
import { BsCircle, BsSlashLg, BsTags } from "react-icons/bs";
import { IconBaseProps } from "react-icons/lib/iconBase";
import {
  PiArrowBendDownRight,
  PiArrowBendUpRight,
  PiArrowClockwise,
  PiArrowCounterClockwise,
  PiArrowSquareOut,
  PiArrowsInSimple,
  PiBinary,
  PiBinaryBold,
  PiCalendarDots,
  PiCaretDown,
  PiCaretLeft,
  PiCaretRight,
  PiCaretUp,
  PiChartBar,
  PiCheck,
  PiCheckCircle,
  PiCircleHalf,
  PiCircleHalfFill,
  PiCirclesFour,
  PiClipboard,
  PiCode,
  PiCornersIn,
  PiCornersOut,
  PiCrosshair,
  PiCursor,
  PiCursorFill,
  PiDotsThreeVertical,
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
  PiMagicWand,
  PiMagnifyingGlass,
  PiMagnifyingGlassMinus,
  PiMagnifyingGlassPlus,
  PiMinusCircle,
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
  PiSpinner,
  PiStackMinus,
  PiStackPlus,
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
  PiWarningOctagon,
  PiX,
} from "react-icons/pi";

import { GraphSelectionMode } from "../core/selection/types";
import { ItemType } from "../core/types";

export const AppearanceIcon = PiPalette;
export const AppearanceIconFill = PiPaletteFill;
export const AutoThemeIcon = PiCircleHalf;
export const AutoThemeSelectedIcon = PiCircleHalfFill;
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
export const EditIcon = PiPencilSimpleLine;
export const EditIconFill = PiPencilSimpleLineFill;
export const ExitFullScreenIcon = PiCornersIn;
export const ExternalLinkIcon = PiArrowSquareOut;
export const FilterAddIcon = PiStackPlus;
export const FilterDeleteIcon = PiStackMinus;
export const FilterDeleteInactiveIcon = PiMinusCircle;
export const FilterOpenFutureIcon = PiArrowBendDownRight;
export const FilterOpenPastIcon = PiArrowBendUpRight;
export const FiltersIcon = PiFunnel;
export const FiltersIconFill = PiFunnelFill;
export const FullScreenIcon = PiCornersOut;
export const GitHubIcon = PiGithubLogo;
export const GraphIcon = PiGraph;
export const GraphIconFill = PiGraphFill;
export const GuessSettingsIcon = PiMagicWand;
export const HomeIcon = PiHouseLine;
export const LassoIcon = PiLasso;
export const LassoIconFill = PiLassoBold;
export const LayoutsIcon = PiPolygon;
export const LayoutsIconFill = PiPolygonFill;
export const LightThemeIcon = PiSun;
export const LightThemeSelectedIcon = PiSunFill;
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
export const ThreeDotsVerticalIcon = PiDotsThreeVertical;
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
export const NodeIcon = BsCircle;
export const EdgeIcon = BsSlashLg;
export const ItemIcons: Record<ItemType, IconType> = {
  nodes: NodeIcon,
  edges: EdgeIcon,
};

export const FieldModelIcons: Record<FieldModelType, IconType> = {
  text: PiTextT,
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
