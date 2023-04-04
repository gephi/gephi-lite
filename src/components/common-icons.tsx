import { IconType } from "react-icons";
import { TbCircles } from "react-icons/tb";
import { RiFilterFill } from "react-icons/ri";
import { ImFilesEmpty } from "react-icons/im";
import { BiNetworkChart } from "react-icons/bi";
import { GrOverview, GrScorecard } from "react-icons/gr";
import { MdLogin, MdLogout, MdOutlineSaveAlt, MdClose } from "react-icons/md";
import { BsSlashLg, BsCircle, BsGithub, BsPalette, BsCodeSlash, BsFillPlayFill } from "react-icons/bs";

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
