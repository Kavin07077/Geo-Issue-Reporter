package com.geo.issue.controller;

import com.geo.issue.model.Issue;
import com.geo.issue.model.IssueHistory;
import com.geo.issue.model.IssueStatus;
import com.geo.issue.model.User;
import com.geo.issue.payload.request.IssueRequest;
import com.geo.issue.repository.IssueHistoryRepository;
import com.geo.issue.repository.UserRepository;
import com.geo.issue.service.IssueService;
import com.geo.issue.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/issues")
public class IssueController {

    @Autowired
    IssueService issueService;
    
    @Autowired
    UserRepository userRepository;

    @Autowired
    IssueHistoryRepository issueHistoryRepository;

    @GetMapping
    @PreAuthorize("hasRole('CITIZEN') or hasRole('STAFF') or hasRole('ADMIN')")
    public List<Issue> getAllIssues() {
        // Can add filtering logic based on role
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        
        // For simplicity returning all, but typically Citizen sees their own or all public issues
        return issueService.getAllIssues();
    }
    
    @GetMapping("/my")
    @PreAuthorize("hasRole('CITIZEN')")
    public List<Issue> getMyIssues() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        return issueService.getIssuesByReporter(userDetails.getId());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CITIZEN') or hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<?> getIssueById(@PathVariable Long id) {
        return issueService.getIssueById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("hasRole('CITIZEN') or hasRole('STAFF') or hasRole('ADMIN')")
    public List<IssueHistory> getIssueHistory(@PathVariable Long id) {
        return issueHistoryRepository.findByIssueIdOrderByChangedAtDesc(id);
    }

    @GetMapping("/assigned")
    @PreAuthorize("hasRole('STAFF')")
    public List<Issue> getAssignedIssues() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        return issueService.getIssuesByAssignee(userDetails.getId());
    }

    @PostMapping(consumes = {"multipart/form-data"})
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<?> createIssue(@ModelAttribute IssueRequest issueRequest) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            User reporter = userRepository.findById(userDetails.getId()).get();
            
            Issue issue = issueService.createIssue(issueRequest, reporter);
            return ResponseEntity.ok(issue);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Error uploading image");
        }
    }
    @PutMapping("/{id}/status/update")
    @PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam IssueStatus status, @RequestParam String comment) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).get();
        
        Issue issue = issueService.updateStatus(id, status, user, comment);
        return ResponseEntity.ok(issue);
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignIssue(@PathVariable Long id, @RequestParam Long staffId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).get();
        
        Issue issue = issueService.assignIssue(id, staffId, user);
        return ResponseEntity.ok(issue);
    }
    
    @GetMapping("/nearby")
    public List<Issue> getNearby(@RequestParam Double lat, @RequestParam Double lng, @RequestParam Double radius) {
        List<Issue> all = issueService.getAllIssues();
        return all.stream().filter(i -> {
            if (i.getLatitude() == null || i.getLongitude() == null) return false;
            double dist = haversine(lat, lng, i.getLatitude(), i.getLongitude());
            return dist <= radius; // radius in km
        }).toList();
    }
    
    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; 
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; 
    }
}
