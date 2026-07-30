package com.geo.issue.repository;

import com.geo.issue.model.Issue;
import com.geo.issue.model.IssueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IssueRepository extends JpaRepository<Issue, Long> {
    List<Issue> findByReporterId(Long reporterId);
    List<Issue> findByAssignedToId(Long assignedToId);
    List<Issue> findByStatus(IssueStatus status);
    
    // Simple bounding box query
    @Query("SELECT i FROM Issue i WHERE i.latitude BETWEEN :minLat AND :maxLat AND i.longitude BETWEEN :minLng AND :maxLng")
    List<Issue> findInBoundingBox(@Param("minLat") Double minLat, @Param("maxLat") Double maxLat, 
                                  @Param("minLng") Double minLng, @Param("maxLng") Double maxLng);
}
