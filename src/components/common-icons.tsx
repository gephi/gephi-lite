import { IconType } from "react-icons";
import { BiNetworkChart } from "react-icons/bi";
import { BsCircle, BsCodeSlash, BsFillPlayFill, BsGithub, BsPalette, BsSearch, BsSlashLg } from "react-icons/bs";
import { GrOverview, GrScorecard } from "react-icons/gr";
import { ImFilesEmpty } from "react-icons/im";
import { MdClose, MdLogin, MdLogout, MdOutlineRefresh, MdOutlineSaveAlt } from "react-icons/md";
import { RiFilterFill } from "react-icons/ri";
import { TbCircles } from "react-icons/tb";

import { ItemType } from "../core/types";

export const GraphIcon = BiNetworkChart;
export const StatisticsIcon = GrScorecard;
export const AppearanceIcon = BsPalette;
export const FiltersIcon = RiFilterFill;
export const LayoutsIcon = TbCircles;
export const FileIcon = ImFilesEmpty;
export const GitHubIcon = BsGithub;
export const SingInIcon = MdLogin;
export const SignOutIcon = MdLogout;
export const ContextIcon = GrOverview;
export const RetryIcon = MdOutlineRefresh;

export const NodeIcon = BsCircle;
export const EdgeIcon = BsSlashLg;
export const ItemIcons: Record<ItemType, IconType> = {
  nodes: NodeIcon,
  edges: EdgeIcon,
};

export const CodeEditorIcon = BsCodeSlash;
export const SaveIcon = MdOutlineSaveAlt;
export const RunIcon = BsFillPlayFill;
export const CloseIcon = MdClose;
export const SearchIcon = BsSearch;
