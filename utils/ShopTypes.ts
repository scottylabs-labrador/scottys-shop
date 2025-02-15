import { UserWithId } from "@/firebase/users";
import { CommItemWithId } from "@/firebase/commItems";
import { MPItemWithId } from "@/firebase/mpItems";

export interface ShopOwnerType extends UserWithId {
  _id: string;
}

export interface FormData {
  name: string;
  title: string;
  description: string;
}

export interface ShopItems {
  commissionItems: CommItemWithId[];
  marketplaceItems: MPItemWithId[];
}