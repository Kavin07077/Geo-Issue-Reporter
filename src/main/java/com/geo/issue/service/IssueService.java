package com.geo.issue.service;

import com.geo.issue.model.*;
import com.geo.issue.payload.request.IssueRequest;
import com.geo.issue.repository.IssueHistoryRepository;
import com.geo.issue.repository.IssueRepository;
import com.geo.issue.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
public class IssueService {

    @Autowired
    IssueRepository issueRepository;

    @Autowired
    IssueHistoryRepository issueHistoryRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    FileStorageService fileStorageService;

    @Transactional
    public Issue createIssue(IssueRequest request, User reporter) throws IOException {
        Issue issue = new Issue();
        issue.setTitle(request.getTitle());
        issue.setDescription(request.getDescription());
        issue.setCategory(request.getCategory());
        issue.setPriority(request.getPriority());
        issue.setLatitude(request.getLatitude());
        issue.setLongitude(request.getLongitude());
        issue.setReporter(reporter);
        issue.setStatus(IssueStatus.NEW);

        // Save first to get ID for file path
        issue = issueRepository.save(issue);

        if (request.getImage() != null && !request.getImage().isEmpty()) {
            String imagePath = fileStorageService.storeFile(request.getImage(), issue.getId());
            issue.setImagePath(imagePath);
            issue = issueRepository.save(issue);
        }

        // Record history
        recordHistory(issue, reporter, null, IssueStatus.NEW, "Issue created");

        return issue;
    }

    @Transactional
    public Issue updateStatus(Long issueId, IssueStatus newStatus, User user, String comment) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Issue not found"));

        IssueStatus oldStatus = issue.getStatus();
        issue.setStatus(newStatus);

        if (newStatus == IssueStatus.RESOLVED || newStatus == IssueStatus.CLOSED) {
            if (issue.getResolutionTime() == null) {
                issue.setResolutionTime(java.time.LocalDateTime.now());
            }
        }

        recordHistory(issue, user, oldStatus, newStatus, comment);

        return issueRepository.save(issue);
    }

    @Transactional
    public Issue assignIssue(Long issueId, Long staffId, User assigner) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Issue not found"));

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        issue.setAssignedTo(staff);
        if (issue.getStatus() == IssueStatus.NEW) {
            issue.setStatus(IssueStatus.ASSIGNED);
        }

        recordHistory(issue, assigner, issue.getStatus(), IssueStatus.ASSIGNED, "Assigned to " + staff.getFullName());

        return issueRepository.save(issue);
    }

    private void recordHistory(Issue issue, User user, IssueStatus oldStatus, IssueStatus newStatus, String comment) {
        IssueHistory history = new IssueHistory();
        history.setIssue(issue);
        history.setChangedBy(user);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setComment(comment);
        issueHistoryRepository.save(history);
    }

    public List<Issue> getAllIssues() {
        return issueRepository.findAll();
    }

    public List<Issue> getIssuesByReporter(Long reporterId) {
        return issueRepository.findByReporterId(reporterId);
    }

    public Optional<Issue> getIssueById(Long id) {
        return issueRepository.findById(id);
    }

    public List<Issue> getIssuesByAssignee(Long assigneeId) {
        return issueRepository.findByAssignedToId(assigneeId);
    }
}
