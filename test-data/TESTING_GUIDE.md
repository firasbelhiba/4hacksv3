# Project Upload System Testing Guide

This guide provides instructions for testing the Project Upload System for 4hacks.

## Prerequisites

1. **Running Application**: Ensure the Next.js application is running on port 3001
2. **Database**: Ensure the database is set up and running
3. **Authentication**: You need to be logged in as a user with hackathon creation permissions

## Test Setup

### 1. Create a Test Hackathon

1. Navigate to `/dashboard/hackathons/new`
2. Create a new hackathon with the following details:
   - Name: "Test Hackathon 2024"
   - Organization: "Test Organization"
   - Start Date: Future date
   - End Date: Future date after start
   - Status: "ACTIVE" (to allow uploads)

### 2. Add Test Tracks

Navigate to the hackathon edit tracks page and add these tracks:
- **Healthcare**: "Health and medical technology solutions"
- **FinTech**: "Financial technology and innovation"
- **EdTech**: "Educational technology platforms"

## Testing Scenarios

### Test 1: Individual Project Upload

1. Navigate to `/dashboard/hackathons/[id]/projects/upload`
2. Select "Individual Upload" tab
3. Fill out the form with valid data:
   - Project Name: "Test Individual Project"
   - Team Name: "Test Team"
   - Description: "A comprehensive test project for validating the individual upload functionality of the system"
   - Track: Select one of the created tracks
   - Team Members: Add 2-3 members
   - Technologies: Add 3-4 technologies
   - GitHub URL: "https://github.com/test/project"
   - Demo URL: "https://test-demo.com"

**Expected Result**: Project should be created successfully with a success toast and redirect to hackathon page.

### Test 2: CSV Template Download

1. Navigate to the bulk upload tab
2. Click "Download Template" button

**Expected Result**: CSV file should download with correct headers and example data matching your hackathon's tracks.

### Test 3: Valid CSV Upload

1. Use the provided `sample-projects.csv` file
2. Ensure track names match your hackathon's tracks (edit the CSV if needed)
3. Upload the file using drag-drop or file selection
4. Click "Validate" button
5. If validation passes, click "Upload" button

**Expected Result**:
- Validation should pass with 5 valid rows
- Upload should succeed with progress tracking
- Projects should appear in the hackathon

### Test 4: Invalid CSV Upload (Error Handling)

1. Use the provided `projects-with-errors.csv` file
2. Upload and validate the file

**Expected Result**:
- Validation should fail with multiple errors
- Error display should show:
  - Empty project name (Row 1)
  - Invalid GitHub URL (Row 2)
  - Invalid track name (Row 2, 5)
  - Duplicate project names (Row 2, 3)
  - Invalid demo URL (Row 4)
  - Too many team members (Row 4)
  - Too many technologies (Row 5)
  - Missing technologies (Row 3, 4)

### Test 5: Progress Tracking

1. Upload a valid CSV with multiple projects
2. Observe the progress tracking component

**Expected Result**:
- Progress steps should show: Parse CSV → Validate Data → Upload Projects → Complete
- Progress bar should advance through each step
- Step details should show relevant information
- Timing information should be displayed

### Test 6: Upload Restrictions

1. Test uploads when hackathon status is "DRAFT"
2. Test uploads when hackathon status is "COMPLETED"
3. Test uploads when hackathon has no tracks

**Expected Result**:
- Appropriate warning banners should appear
- Upload functionality should be disabled
- Clear instructions should be provided

## Error Scenarios to Test

### CSV Format Errors
- Upload a non-CSV file
- Upload a CSV with missing headers
- Upload a CSV with extra columns
- Upload an empty CSV

### Validation Errors
- Projects with duplicate names within CSV
- Projects with duplicate names in database
- Invalid URLs (malformed)
- Missing required fields
- Field length violations (description too short/long)
- Invalid GitHub URLs (non-GitHub domains)

### Network Errors
- Test with network disconnected
- Test with slow network (throttle in dev tools)

## Performance Testing

### Large File Upload
Create a CSV with 100-500 projects to test:
- File parsing performance
- Validation speed
- Progress tracking accuracy
- Memory usage during upload

### Concurrent Uploads
Test multiple users uploading simultaneously to the same hackathon.

## Browser Testing

Test the upload system in:
- Chrome/Chromium
- Firefox
- Safari (if available)
- Edge

Test responsive design on:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

## Accessibility Testing

1. Test keyboard navigation through the upload forms
2. Test screen reader compatibility
3. Verify color contrast for error states
4. Test with high contrast mode

## Security Testing

1. Attempt to upload projects to hackathons you don't own
2. Test with malicious CSV content (script injection attempts)
3. Verify file type restrictions
4. Test file size limits

## Expected System Behavior

### Successful Operations
- Clear success messages
- Proper redirects after completion
- Data persistence in database
- No memory leaks during large uploads

### Error Handling
- Informative error messages
- No system crashes
- Graceful degradation
- Recovery options provided

### Performance
- File parsing should complete within 5 seconds for 500 rows
- Validation should complete within 10 seconds for 500 rows
- Upload progress should update smoothly
- UI should remain responsive during operations

## Troubleshooting

### Common Issues

1. **Validation fails unexpectedly**
   - Check track names match exactly (case-insensitive)
   - Verify GitHub URL format
   - Check for hidden characters in CSV

2. **Upload stalls**
   - Check network connection
   - Verify server is running
   - Check browser console for errors

3. **Progress tracking not updating**
   - Refresh the page
   - Check WebSocket connections
   - Verify browser JavaScript is enabled

### Debug Information

When reporting issues, include:
- Browser and version
- File size and row count
- Console error messages
- Network tab information
- Steps to reproduce

## Sample Data Reference

### Valid Project Structure
```csv
project_name,team_name,description,github_url,demo_url,video_url,track_name,technologies,team_members
"AI Health Monitor","Team Alpha","Detailed description...","https://github.com/user/repo","https://demo.com","","Healthcare","React,Node.js","John Doe,Jane Smith"
```

### Required Fields
- project_name (1-100 characters)
- team_name (1-100 characters)
- description (50-2000 characters)
- github_url (valid GitHub repository URL)
- track_name (must match existing track)
- technologies (1-20 items, comma-separated)
- team_members (1-10 members, comma-separated)

### Optional Fields
- demo_url (valid URL)
- video_url (valid URL)

This testing guide covers the major functionality and edge cases for the Project Upload System. Follow these tests to ensure the system works correctly across different scenarios and user conditions.