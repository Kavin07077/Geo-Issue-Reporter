package com.geo.issue.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    public String storeFile(MultipartFile file, Long issueId) throws IOException {
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());
        
        // Generate unique filename to prevent duplicates
        String uniqueFileName = UUID.randomUUID().toString() + "_" + fileName;

        // Path: ./uploads/issues/{issueId}/
        Path uploadPath = Paths.get(uploadDir + "/issues/" + issueId);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        try {
            Path filePath = uploadPath.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            return "/issues/" + issueId + "/" + uniqueFileName;
        } catch (IOException e) {
            throw new IOException("Could not store file " + fileName + ". Please try again!", e);
        }
    }
}
