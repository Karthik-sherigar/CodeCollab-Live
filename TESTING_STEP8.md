# Testing Step 8: Inline Code Comments

## Backend API Testing (Using Postman or curl)

### 1. Test Create Comment
```bash
# Get your JWT token first (from login)
TOKEN="your_jwt_token_here"

# Create a comment on line 5
curl -X POST http://localhost:5000/api/sessions/1/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "startLine": 5,
    "text": "This is a test comment on line 5"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "comment": {
    "_id": "...",
    "sessionId": "1",
    "startLine": 5,
    "endLine": 5,
    "status": "OPEN",
    "comments": [
      {
        "commentId": "...",
        "text": "This is a test comment on line 5",
        "authorName": "Your Name"
      }
    ]
  }
}
```

### 2. Test Get All Comments
```bash
curl http://localhost:5000/api/sessions/1/comments \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "comments": [...]
}
```

### 3. Test Add Reply
```bash
# Get threadId from previous response
THREAD_ID="thread_id_here"

curl -X PUT http://localhost:5000/api/sessions/1/comments/$THREAD_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "text": "This is a reply to the comment"
  }'
```

### 4. Test Resolve Comment
```bash
curl -X PATCH http://localhost:5000/api/sessions/1/comments/$THREAD_ID/resolve \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** Status changes to "RESOLVED"

### 5. Test Reopen Comment
```bash
curl -X PATCH http://localhost:5000/api/sessions/1/comments/$THREAD_ID/reopen \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** Status changes back to "OPEN"

---

## Socket.IO Testing (Browser Console)

### 1. Open Browser Console (F12)

### 2. Test Socket Connection
```javascript
// Check if socket is connected
console.log('Socket connected:', socket.connected);
```

### 3. Test Add Comment Event
```javascript
// Emit add-comment event
socket.emit('add-comment', {
  sessionId: '1',
  startLine: 10,
  text: 'Test comment via socket',
  user: {
    id: 'user123',
    name: 'Test User'
  }
});
```

### 4. Listen for Comment Added
```javascript
// Listen for comment-added event
socket.on('comment-added', (data) => {
  console.log('💬 Comment added:', data);
});
```

### 5. Test in Two Browsers
1. Open session in Browser 1
2. Open same session in Browser 2
3. Add comment in Browser 1
4. **Expected:** Comment appears in Browser 2 console

---

## Full Integration Testing (After Frontend Complete)

### Test Scenario 1: Add Comment
1. **Login** to the application
2. **Join a session**
3. **Click on line number** in Monaco editor
4. **Click "Add Comment"** button
5. **Type comment** in modal
6. **Click "Add Comment"**
7. **Expected:**
   - Comment appears in comment panel
   - Line shows comment indicator (glyph icon)
   - Other users see the comment in real-time

### Test Scenario 2: Reply to Comment
1. **Open comment panel**
2. **Click "Reply"** on a comment thread
3. **Type reply**
4. **Click "Reply"** button
5. **Expected:**
   - Reply appears in thread
   - Other users see reply in real-time

### Test Scenario 3: Resolve Comment
1. **Click resolve button** (✓) on comment thread
2. **Expected:**
   - Thread status changes to "RESOLVED"
   - Line decoration changes color (green)
   - Other users see resolved status

### Test Scenario 4: Multi-User Real-Time
1. **Open 2 browsers** with different users
2. **Join same session**
3. **User 1:** Add comment on line 5
4. **Expected in User 2:**
   - Comment appears immediately
   - Line 5 shows comment indicator
   - Comment panel updates
5. **User 2:** Reply to comment
6. **Expected in User 1:**
   - Reply appears in thread immediately

---

## Debugging Tips

### Check Backend Logs
```bash
# Backend should show:
💬 Comment added: { sessionId: '1', startLine: 5, ... }
```

### Check Frontend Console
```javascript
// Should see:
💬 Received comment-added: { ... }
📍 Updated comments state: [...]
```

### Check MongoDB
```bash
# Connect to MongoDB
mongosh

# Use database
use collabcode

# Check comments
db.commentthreads.find().pretty()
```

### Common Issues

**Issue:** Comments not appearing
- **Check:** Socket connection status
- **Check:** JWT token is valid
- **Check:** User is workspace member

**Issue:** Comments not syncing
- **Check:** Both users in same session
- **Check:** Socket.IO CORS settings
- **Check:** Backend logs for errors

**Issue:** Cannot add comment
- **Check:** Session is ACTIVE
- **Check:** User has workspace access
- **Check:** MongoDB connection

---

## Quick Test Commands

```bash
# Restart backend
cd backend && npm start

# Check MongoDB connection
mongosh --eval "db.adminCommand('ping')"

# Check if comment collection exists
mongosh collabcode --eval "db.commentthreads.countDocuments()"

# Clear all comments (for testing)
mongosh collabcode --eval "db.commentthreads.deleteMany({})"
```
