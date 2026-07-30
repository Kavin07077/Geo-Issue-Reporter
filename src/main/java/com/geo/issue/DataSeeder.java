package com.geo.issue;

import com.geo.issue.model.*;
import com.geo.issue.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired UserRepository userRepository;
    @Autowired IssueRepository issueRepository;
    @Autowired DepartmentRepository departmentRepository;
    @Autowired PasswordEncoder encoder;

    @Override
    public void run(String... args) throws Exception {
        User admin = seedUser("admin", "admin123", "admin@geo.com", "Admin User", UserRole.ADMIN, true);

        User staff1 = seedUser("staff1", "staff123", "staff1@geo.com", "Staff One", UserRole.STAFF, true);
        User staff2 = seedUser("staff2", "staff123", "staff2@geo.com", "Staff Two", UserRole.STAFF, true);
        User staff3 = seedUser("staff3", "staff123", "staff3@geo.com", "Staff Three", UserRole.STAFF, true);

        User citizen1 = seedUser("citizen1", "citizen123", "citizen1@geo.com", "Citizen One", UserRole.CITIZEN, true);
        User citizen2 = seedUser("citizen2", "citizen123", "citizen2@geo.com", "Citizen Two", UserRole.CITIZEN, true);
        User citizen3 = seedUser("citizen3", "citizen123", "citizen3@geo.com", "Citizen Three", UserRole.CITIZEN, true);
        User citizen4 = seedUser("citizen4", "citizen123", "citizen4@geo.com", "Citizen Four", UserRole.CITIZEN, true);
        User citizen5 = seedUser("citizen5", "citizen123", "citizen5@geo.com", "Citizen Five", UserRole.CITIZEN, true);

        if (issueRepository.count() == 0) {
            seedSampleIssues(List.of(citizen1, citizen2, citizen3, citizen4, citizen5), List.of(staff1, staff2, staff3));
        }

        System.out.println("Default users and sample issues seeded successfully.");
    }

    private User seedUser(String username, String password, String email, String fullName, UserRole role, boolean approved) {
        return userRepository.findByUsername(username).orElseGet(() -> {
            User u = new User();
            u.setUsername(username);
            u.setPasswordHash(encoder.encode(password));
            u.setEmail(email);
            u.setFullName(fullName);
            u.setRole(role);
            u.setApproved(approved);
            return userRepository.save(u);
        });
    }

    private void seedSampleIssues(List<User> citizens, List<User> staffList) {
        String[] titles = {
            "Large Pothole on Main Street",
            "Broken Streetlight on Oak Avenue",
            "Illegal Garbage Dump near Park",
            "Water Pipe Leakage at 5th Block",
            "Damaged Traffic Signal at Intersection",
            "Deep Pothole causing Traffic Jam",
            "Flickering Streetlight in Residential Zone",
            "Overflowing Waste Bin on Commercial Road",
            "Burst Water Main causing Flooding",
            "Missing Manhole Cover",
            "Road Surface Cracking near School",
            "Dark Street Light Pole #12",
            "Uncollected Trash Pile",
            "Clean Water Leak from Pipeline",
            "Traffic Signal Stuck on Red",
            "Hazardous Pothole near Bus Stop",
            "Street Light Fixture Hanging Low",
            "Construction Waste Dumped on Sidewalk",
            "Drainage Overflow on Highway",
            "Broken Pedestrian Crossing Signal"
        };

        String[] categories = {
            "Pothole", "Streetlight Failure", "Garbage Dump", "Water Leakage", "Traffic Signal",
            "Pothole", "Streetlight Failure", "Garbage Dump", "Water Leakage", "Pothole",
            "Pothole", "Streetlight Failure", "Garbage Dump", "Water Leakage", "Traffic Signal",
            "Pothole", "Streetlight Failure", "Garbage Dump", "Water Leakage", "Traffic Signal"
        };

        IssuePriority[] priorities = {
            IssuePriority.HIGH, IssuePriority.MEDIUM, IssuePriority.HIGH, IssuePriority.CRITICAL, IssuePriority.HIGH,
            IssuePriority.CRITICAL, IssuePriority.LOW, IssuePriority.MEDIUM, IssuePriority.CRITICAL, IssuePriority.CRITICAL,
            IssuePriority.MEDIUM, IssuePriority.LOW, IssuePriority.HIGH, IssuePriority.MEDIUM, IssuePriority.HIGH,
            IssuePriority.HIGH, IssuePriority.MEDIUM, IssuePriority.LOW, IssuePriority.CRITICAL, IssuePriority.HIGH
        };

        IssueStatus[] statuses = {
            IssueStatus.NEW, IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.RESOLVED, IssueStatus.CLOSED,
            IssueStatus.NEW, IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.RESOLVED, IssueStatus.NEW,
            IssueStatus.ASSIGNED, IssueStatus.NEW, IssueStatus.IN_PROGRESS, IssueStatus.RESOLVED, IssueStatus.NEW,
            IssueStatus.ASSIGNED, IssueStatus.NEW, IssueStatus.IN_PROGRESS, IssueStatus.RESOLVED, IssueStatus.NEW
        };

        double baseLat = 51.505;
        double baseLng = -0.09;

        for (int i = 0; i < titles.length; i++) {
            Issue issue = new Issue();
            issue.setTitle(titles[i]);
            issue.setDescription("Automated report details for: " + titles[i] + ". Please inspect and resolve promptly.");
            issue.setCategory(categories[i]);
            issue.setPriority(priorities[i]);
            issue.setStatus(statuses[i]);
            issue.setReporter(citizens.get(i % citizens.size()));
            issue.setLatitude(baseLat + (Math.sin(i) * 0.02));
            issue.setLongitude(baseLng + (Math.cos(i) * 0.02));

            if (statuses[i] != IssueStatus.NEW) {
                issue.setAssignedTo(staffList.get(i % staffList.size()));
            }

            issueRepository.save(issue);
        }
    }
}
