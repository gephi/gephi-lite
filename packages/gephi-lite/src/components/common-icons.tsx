import { FieldModelType } from "@gephi/gephi-lite-sdk";
import { FC } from "react";
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
import { IconBaseProps } from "react-icons/lib/iconBase";
import { MdLogin, MdLogout, MdOutlineRefresh, MdOutlineSaveAlt } from "react-icons/md";
import {
  PiArrowSquareOut,
  PiArrowsOut,
  PiCaretDown,
  PiCaretLeft,
  PiCaretRight,
  PiCaretUp,
  PiChartBar,
  PiChartBarFill,
  PiCheck,
  PiCircleHalf,
  PiCircleHalfFill,
  PiDotsThreeVertical,
  PiFunnel,
  PiFunnelFill,
  PiGear,
  PiGpsFix,
  PiGraph,
  PiGraphFill,
  PiMagnifyingGlass,
  PiMagnifyingGlassMinus,
  PiMagnifyingGlassPlus,
  PiMoonStars,
  PiMoonStarsFill,
  PiPalette,
  PiPaletteFill,
  PiPlusCircle,
  PiPlusCircleFill,
  PiPolygon,
  PiPolygonFill,
  PiSun,
  PiSunFill,
  PiTable,
  PiTableFill,
  PiTrash,
  PiX,
} from "react-icons/pi";

import { ItemType } from "../core/types";

export const GraphIcon = PiGraph;
export const GraphIconFill = PiGraphFill;
export const DataIcon = PiTable;
export const DataIconFill = PiTableFill;
export const DataCreationIcon = PiPlusCircle;
export const DataCreationIconFill = PiPlusCircleFill;
export const CaretDownIcon = PiCaretDown;
export const CaretUpIcon = PiCaretUp;
export const CaretLeftIcon = PiCaretLeft;
export const CaretRightIcon = PiCaretRight;
export const AppearanceIcon = PiPalette;
export const AppearanceIconFill = PiPaletteFill;
export const FiltersIcon = PiFunnel;
export const FiltersIconFill = PiFunnelFill;
export const StatisticsIcon = PiChartBar;
export const StatisticsIconFill = PiChartBarFill;
export const LayoutsIcon = PiPolygon;
export const LayoutsIconFill = PiPolygonFill;
export const ExternalLinkIcon = PiArrowSquareOut;
export const LocateIcon = PiGpsFix;
export const ZoomInIcon = PiMagnifyingGlassPlus;
export const ZoomOutIcon = PiMagnifyingGlassMinus;
export const FullScreenIcon = PiArrowsOut;
export const ThreeDotsVerticalIcon = PiDotsThreeVertical;
export const TrashIcon = PiTrash;

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
export const CheckedIcon = PiCheck;
export const SearchIcon = PiMagnifyingGlass;
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
export const FieldModelIcon: FC<IconBaseProps & { type: FieldModelType }> = ({ type, ...props }) => {
  const Icon = FieldModelIcons[type];
  if (!Icon) {
    console.error(`Field model type "${type}" is not recognized.`);
    return null;
  }
  return <Icon {...props} />;
};
