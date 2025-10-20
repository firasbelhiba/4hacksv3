declare class TrackDto {
    name: string;
    description: string;
    prize?: string;
    order?: number;
    eligibilityCriteria?: string[];
}
declare class BasicInfoDto {
    name: string;
    slug?: string;
    description: string;
    organizationName: string;
    prizePool?: string;
    bannerImage?: string;
}
declare class ScheduleDto {
    startDate: string;
    endDate: string;
    registrationDeadline?: string;
    evaluationPeriodEnd?: string;
    resultAnnouncementDate?: string;
    timezone?: string;
}
declare class TracksWrapperDto {
    tracks: TrackDto[];
}
export declare class CreateHackathonDto {
    basicInfo: BasicInfoDto;
    schedule: ScheduleDto;
    tracks: TracksWrapperDto;
    settings?: any;
}
export {};
