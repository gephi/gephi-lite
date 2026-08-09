import { FieldModelType } from "@gephi/gephi-lite-sdk";
import { FC } from "react";
import { IconType } from "react-icons";
import { BsTags } from "react-icons/bs";
import { IconBaseProps } from "react-icons/lib/iconBase";
import {
  PiArrowClockwise,
  PiArrowCounterClockwise,
  PiArrowDown,
  PiArrowSquareOut,
  PiArrowUp,
  PiArrowsClockwise,
  PiArrowsInSimple,
  PiArrowsLeftRight,
  PiBinary,
  PiBinaryBold,
  PiBug,
  PiCalendarDots,
  PiCaretDown,
  PiCaretLeft,
  PiCaretRight,
  PiCaretUp,
  PiChartBar,
  PiChatCircleDots,
  PiCheck,
  PiCheckCircle,
  PiCheckSquare,
  PiCheckSquareOffset,
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
  PiFloppyDisk,
  PiFunnel,
  PiFunnelFill,
  PiGear,
  PiGithubLogo,
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
  PiPath,
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
  PiShareNetwork,
  PiSignIn,
  PiSortAscending,
  PiSortDescending,
  PiSpinner,
  PiSquare,
  PiStarFill,
  PiStop,
  PiStopFill,
  PiSun,
  PiSunFill,
  PiTable,
  PiTableFill,
  PiTextT,
  PiTranslate,
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
export const CreateEdgeIcon = PiPlusCircle;
export const CreateNodeIcon = PiPlusCircle;
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
export const FeedbackIcon = PiChatCircleDots;
export const FilterAddIcon = PiPlusCircle;
export const FilterDeleteIcon = PiTrash;
export const FilterEnabledIcon = PiCheckSquare;
export const FilterDisabledIcon = PiSquare;
export const FilterMoveUpIcon = PiArrowUp;
export const FilterMoveDownIcon = PiArrowDown;
export const FiltersIcon = PiFunnel;
export const FiltersIconFill = PiFunnelFill;
export const FullScreenIcon = PiCornersOut;
export const GitHubIcon = PiGithubLogo;
export const GraphIcon = PiGraph;
export const GraphIconFill = PiGraphFill;
export const GuessSettingsIcon = PiMagicWand;
export const HomeIcon = PiHouseLine;
export const InvalidDataIcon = PiWarningCircle;
export const LanguageIcon = PiTranslate;
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
// Same glyph as MenuCollapseIcon, and for the same reason: on a small screen both panels are
// stacked at the bottom of the screen, so folding one back down is the same gesture.
export const PanelCollapseIcon = PiCaretDown;
export const SortAlphabeticalIcon = PiSortAscending;
export const SortBySizeIcon = PiSortDescending;
export const SelectPathIcon = PiPath;
export const PlayIcon = PiPlay;
export const PlayIconFill = PiPlayFill;
export const ResetIcon = PiArrowCounterClockwise;
export const RetryIcon = PiArrowClockwise;
export const SaveIcon = PiFloppyDisk;
export const SearchIcon = PiMagnifyingGlass;
export const SelectEdgesIcon = PiLineSegment;
export const SelectNeighborsIcon = PiShareNetwork;
export const UnsavedChangesIcon = PiStarFill;
export const SettingsIcon = PiGear;
export const StopIcon = PiStop;
export const StopIconFill = PiStopFill;
export const SwapIcon = PiArrowsLeftRight;
export const SyncIcon = PiArrowsClockwise;
export const ThreeDotsVerticalIcon = PiDotsThreeVerticalBold;
export const TrashIcon = PiTrash;
export const UnselectAllIcon = PiSpinner;
export const UserIcon = PiUser;
export const ZoomInIcon = PiMagnifyingGlassPlus;
export const ZoomOutIcon = PiMagnifyingGlassMinus;
// Reuses the same glyph as OpenInGraphIcon (the "Locate on the graph" icon), for visual
// consistency between the graph controls and the locate buttons elsewhere in the app. The button's
// function is unchanged: it still resets/fits the camera.
export const ZoomResetIcon = PiCrosshair;
export const MissingValueFilterIcon = PiSpinner;

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
  boolean: PiCheckSquareOffset,
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
export const WarningIcon = PiWarning;
