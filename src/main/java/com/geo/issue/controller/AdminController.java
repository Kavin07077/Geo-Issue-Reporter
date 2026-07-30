package com.geo.issue.controller;

import com.geo.issue.model.User;
import com.geo.issue.model.UserRole;
import com.geo.issue.repository.UserRepository;
import com.geo.issue.repository.IssueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.geo.issue.payload.response.MessageResponse;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    IssueRepository issueRepository;

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    @GetMapping("/staff")
    public List<User> getStaff() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.STAFF)
                .toList();
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalIssues", issueRepository.count());
        stats.put("totalUsers", userRepository.count());
        stats.put("pendingApprovals", userRepository.findByApproved(false).size());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/pending")
    public List<User> getPendingUsers() {
        return userRepository.findByApproved(false);
    }

    @PutMapping("/users/{id}/approve")
    public ResponseEntity<?> approveUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setApproved(true);
        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponse(user.getFullName() + " has been approved."));
    }

    @PutMapping("/users/{id}/reject")
    public ResponseEntity<?> rejectUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
        return ResponseEntity.ok(new MessageResponse(user.getFullName() + " has been rejected and removed."));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
        return ResponseEntity.ok(new MessageResponse(user.getFullName() + " has been deleted."));
    }
}
