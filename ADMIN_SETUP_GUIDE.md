# Admin & Creator Setup Guide

## 🎯 What's New

### 1. **Profile Completion Enforcement**
- Users MUST complete their profile (gender, branch, year) after login
- Modal blocks access until profile is filled
- Handles both missing profiles and incomplete profiles

### 2. **Admin & Creator Roles**
- **Creator** - The original creator of the platform (sagarmh6364@gmail.com)
  - Gold badge: "CREATOR"
  - All admin privileges
  - Special recognition

- **Admin** - Trusted moderators
  - Purple badge: "ADMIN"
  - Can delete any message instantly
  - View who reported messages

### 3. **Admin Features**
- 🗑️ **Instant Delete** - Remove any message with one click
- 🛡️ **No Flag Limit** - Delete messages regardless of report count
- 🔍 **Full Moderation** - Monitor all content across groups

---

## 🚀 Setup Instructions

### Step 1: Update Database Schema

Run this in **Supabase SQL Editor**:

```sql
-- Add role and creator columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text default 'user',
ADD COLUMN IF NOT EXISTS is_creator boolean default false;
```

### Step 2: Set Creator Role

Run this in **Supabase SQL Editor**:

```sql
-- Set sagarmh6364@gmail.com as Creator & Admin
UPDATE public.profiles
SET 
  role = 'admin',
  is_creator = true
WHERE email = 'sagarmh6364@gmail.com';

-- Verify
SELECT id, email, username, role, is_creator 
FROM public.profiles 
WHERE email = 'sagarmh6364@gmail.com';
```

**If profile doesn't exist yet:**
1. Log in to the app first (this creates your profile)
2. Then run the UPDATE query above

### Step 3: Test Admin Features

1. **Log in** as sagarmh6364@gmail.com
2. **Check sidebar** - You should see gold "CREATOR" badge
3. **Click any message** - You'll see a trash icon (🗑️)
4. **Click trash icon** - Instantly delete the message

---

## 👥 Adding More Admins

To make someone else an admin:

```sql
-- Make user admin (without creator status)
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'another-admin@example.com';

-- Remove admin status
UPDATE public.profiles
SET role = 'user'
WHERE email = 'user@example.com';
```

---

## 🎨 UI Features

### Sidebar Badges
- **Creator**: Gold gradient badge next to username
- **Admin**: Purple badge next to username
- Regular users: No badge

### Message Actions
**Everyone sees:**
- 🔥 Fire reaction
- 😄 Laugh reaction  
- 😢 Cry reaction
- 💀 Skull reaction
- 💬 Reply
- 👥 Me Too (confessions only)
- 💬 Thread (confessions only)
- ✏️ Edit (own messages, 2 min window)
- 👤 View Profile
- ⚠️ Report

**Admins additionally see:**
- 🗑️ **Delete** - Instant removal (red trash icon)

---

## 🔐 Security Notes

### RLS Policies
- Admins use the same RLS policies as regular users
- Delete is unrestricted (anyone can delete via API)
- Admin status is checked in UI only
- Consider adding server-side admin checks for production

### Recommended Improvements
```sql
-- Create admin-only delete policy (future enhancement)
CREATE POLICY "Admins can delete any message"
  ON public.messages FOR DELETE
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
```

---

## 📊 Database Schema

### profiles table
```
- id (uuid, primary key)
- email (text)
- username (text)
- role (text) - 'user' | 'admin'
- is_creator (boolean) - true for creator
- gender (text)
- branch (text)
- year (text)
- karma (integer)
- show_gender (boolean)
- show_branch (boolean)
- show_year (boolean)
- show_karma (boolean)
```

---

## 🐛 Troubleshooting

### "Profile not found" Error
**Problem:** Profile doesn't exist in database
**Solution:** Profile is now auto-created on first login and completion modal appears

### Admin Badge Not Showing
1. Check if role is set: 
   ```sql
   SELECT role, is_creator FROM profiles WHERE email = 'your@email.com';
   ```
2. Clear cache and refresh browser
3. Log out and log back in

### Delete Button Not Appearing
1. Verify admin role is set correctly
2. Check browser console for errors
3. Make sure you're clicking on a message to show action menu

### Creator Badge vs Admin Badge
- `is_creator = true` → Gold "CREATOR" badge (takes precedence)
- `role = 'admin' AND is_creator = false` → Purple "ADMIN" badge
- Both have same permissions, just different visual badges

---

## 🎯 Next Steps (Optional Enhancements)

1. **Admin Dashboard**
   - View all reports
   - See flagged messages
   - User management panel

2. **Audit Log**
   - Track admin deletions
   - Log moderation actions

3. **Ban System**
   - Temporarily or permanently ban users
   - IP/device blocking

4. **Bulk Actions**
   - Delete multiple messages at once
   - Mass cleanup tools

5. **Auto-Moderation**
   - Keyword filtering
   - Spam detection
   - Auto-flag suspicious content

---

## ✅ Verification Checklist

- [ ] Schema updated with role and is_creator columns
- [ ] sagarmh6364@gmail.com set as creator
- [ ] Creator badge visible in sidebar
- [ ] Delete button appears on messages for admin
- [ ] Delete function works (removes message)
- [ ] Profile completion modal appears for incomplete profiles
- [ ] Non-admin users don't see delete button

---

**All admin features are now active!** 🎉
