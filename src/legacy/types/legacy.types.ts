import { LegacyEvents } from '../enums/legacy.enums';

export type LegacyAddedType = LegacyEvents.AvatarAdded | LegacyEvents.ItemAdded | LegacyEvents.GemAdded;

export type LegacyLikedType = LegacyEvents.AvatarLiked | LegacyEvents.ItemLiked | LegacyEvents.GemLiked;

export type LegacyUsedType = LegacyEvents.AvatarUsed | LegacyEvents.ItemUsed | LegacyEvents.GemUsed;
