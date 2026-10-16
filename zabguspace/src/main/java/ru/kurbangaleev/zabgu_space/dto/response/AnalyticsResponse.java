package ru.kurbangaleev.zabgu_space.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

@Getter
@Builder
public class AnalyticsResponse {
    private Long totalApplications;
    private Long approvedApplications;
    private Long rejectedApplications;
    private List<RoomBookingCount> roomPopularity;
    private List<DailyBookingCount> dailyActivity;
}