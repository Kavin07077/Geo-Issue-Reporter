package com.geo.issue.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "issue_history")
public class IssueHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id", nullable = false)
    @JsonIgnoreProperties({"reporter", "assignedTo", "description", "category", "priority", "latitude", "longitude", "imagePath", "resolutionTime", "reportTime"})
    private Issue issue;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "changed_by", nullable = false)
    @JsonIgnoreProperties({"passwordHash", "createdAt", "updatedAt", "phone", "email", "approved"})
    private User changedBy;

    @Enumerated(EnumType.STRING)
    private IssueStatus oldStatus;

    @Enumerated(EnumType.STRING)
    private IssueStatus newStatus;

    private String comment;

    @CreationTimestamp
    private LocalDateTime changedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Issue getIssue() { return issue; }
    public void setIssue(Issue issue) { this.issue = issue; }
    public User getChangedBy() { return changedBy; }
    public void setChangedBy(User changedBy) { this.changedBy = changedBy; }
    public IssueStatus getOldStatus() { return oldStatus; }
    public void setOldStatus(IssueStatus oldStatus) { this.oldStatus = oldStatus; }
    public IssueStatus getNewStatus() { return newStatus; }
    public void setNewStatus(IssueStatus newStatus) { this.newStatus = newStatus; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }
}
