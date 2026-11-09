import { IsIn, IsUUID } from 'class-validator';

export const AFFILIATE_ITEM_KINDS = ['ingredient', 'equipment'] as const;
export type AffiliateItemKind = (typeof AFFILIATE_ITEM_KINDS)[number];

export class RecordAffiliateClickDto {
  @IsUUID()
  recipeId!: string;

  @IsIn(AFFILIATE_ITEM_KINDS)
  itemKind!: AffiliateItemKind;

  @IsUUID()
  itemId!: string;
}
