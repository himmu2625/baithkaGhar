# 📥 Manual Review Import Guide (Phase 1)

## Overview

This guide explains how to manually import reviews from OTA platforms (Google, Booking.com, Airbnb, MakeMyTrip, JustDial) to your Baithaka GHAR website.

**Why Phase 1?**
- ✅ Quick to implement
- ✅ No technical complexity
- ✅ No API costs
- ✅ Full control over what's displayed
- ✅ 100% legal (you're manually copying public reviews)

---

## 🎯 Step-by-Step Import Process

### Step 1: Access the Import Page

1. Log in to your admin panel
2. Navigate to: **Admin Dashboard → Reviews → Import Reviews**
3. URL: `https://yourdomain.com/admin/reviews/import`

### Step 2: Select Property

1. Use the dropdown to select which property these reviews belong to
2. Make sure you've selected the correct property before importing

### Step 3: Copy Reviews from OTA Platforms

Now, let's copy reviews from each platform:

---

## 📋 Platform-Specific Instructions

### **⭐ Google Reviews**

**How to find your Google reviews:**
1. Search "Your Property Name + Location" on Google
2. Scroll to the reviews section
3. Click "More reviews" or "See all reviews"

**What to copy:**
- **Guest Name:** The reviewer's name (e.g., "Rahul Sharma")
- **Rating:** Star rating (1-5)
- **Comment:** The full review text
- **Review Date:** When the review was posted
- **Source Review ID:** You can use `google_<timestamp>` or copy the review URL

**Example:**
```
Guest Name: Priya Patel
Rating: 5
Comment: Excellent property! The location was perfect and the host was very responsive. Clean rooms and great amenities.
Source: Google
Source Review ID: google_1699123456
Review Date: 2024-11-01
```

---

### **🏨 Booking.com Reviews**

**How to find your Booking.com reviews:**
1. Log in to your Booking.com extranet
2. Go to "Guest Reviews" section
3. Or visit your public property page on Booking.com

**What to copy:**
- **Guest Name:** Usually shows as "Guest from [Country]" or first name
- **Rating:** Score out of 10 (convert to 5-star: divide by 2)
- **Comment:** Both positive and negative comments (combine them)
- **Review Date:** When the review was posted
- **Source Review ID:** `booking_<booking_id>` or use the review date

**Rating Conversion:**
- 10.0 → 5 stars
- 9.0-9.9 → 5 stars
- 8.0-8.9 → 4 stars
- 7.0-7.9 → 4 stars
- 6.0-6.9 → 3 stars
- 5.0-5.9 → 3 stars
- Below 5.0 → 2 stars

**Example:**
```
Guest Name: Michael from UK
Rating: 4 (original: 8.5)
Comment: Positive: Great location, clean rooms. Negative: WiFi could be faster.
Source: Booking.com
Source Review ID: booking_987654321
Review Date: 2024-10-28
```

---

### **🏠 Airbnb Reviews**

**How to find your Airbnb reviews:**
1. Log in to your Airbnb host dashboard
2. Go to "Reviews" section
3. Or visit your public listing page

**What to copy:**
- **Guest Name:** First name only (Airbnb policy)
- **Rating:** Overall rating (out of 5 stars)
- **Comment:** The review text
- **Review Date:** When the review was posted
- **Source Review ID:** `airbnb_<reservation_code>`

**Example:**
```
Guest Name: Sarah
Rating: 5
Comment: Amazing experience! The property was exactly as described. Beautiful views and the host was super helpful. Highly recommend!
Source: Airbnb
Source Review ID: airbnb_HM123456789
Review Date: 2024-10-25
```

---

### **✈️ MakeMyTrip Reviews**

**How to find your MMT reviews:**
1. Log in to your MakeMyTrip partner dashboard
2. Check the reviews section
3. Or visit your property page on MakeMyTrip website

**What to copy:**
- **Guest Name:** Reviewer name
- **Rating:** Star rating (1-5)
- **Comment:** Review text
- **Review Date:** When posted
- **Source Review ID:** `mmt_<booking_ref>`

---

### **📱 JustDial Reviews**

**How to find your JustDial reviews:**
1. Visit JustDial website
2. Search for your property
3. View customer ratings & reviews

**What to copy:**
- **Guest Name:** Reviewer name
- **Rating:** Star rating (1-5)
- **Comment:** Review text
- **Review Date:** When posted
- **Source Review ID:** `justdial_<review_id>`

---

## 🖊️ Fill in the Import Form

### Form Fields:

1. **Guest Name** (Required)
   - Copy the reviewer's name exactly as shown
   - If anonymous, use "Guest from [Location]"

2. **Rating** (Required)
   - Select 1-5 stars
   - Convert if needed (Booking.com uses 10-point scale)

3. **Source Platform** (Required)
   - Select: Google, Booking.com, Airbnb, MakeMyTrip, JustDial, or Other

4. **Review Date** (Optional)
   - When the review was originally posted
   - Helps maintain chronological order

5. **Review Comment** (Required)
   - Copy the full review text
   - For Booking.com, combine positive + negative comments

6. **Source Review ID** (Optional but Recommended)
   - Helps prevent duplicates
   - Format: `platform_uniqueid` (e.g., `google_123456`)

### Adding Multiple Reviews:

1. Click **"+ Add Another Review"** to add more reviews
2. Fill in each review's details
3. You can import up to 50 reviews at once
4. Use **"Load Example Reviews"** button to see sample data

---

## ✅ Import the Reviews

1. Double-check all information is correct
2. Make sure you selected the right property
3. Click **"Import X Review(s)"** button
4. Wait for success message
5. Reviews will immediately appear on your property page

---

## 🎨 How Reviews Appear on Your Website

After importing, reviews will display with:

✅ **Source Badges:**
- ⭐ Google (Blue badge)
- 🏨 Booking.com (Indigo badge)
- 🏠 Airbnb (Red badge)
- ✈️ MakeMyTrip (Orange badge)
- 📱 JustDial (Green badge)
- 📥 Imported/Other (Gray badge)

✅ **Verified Badge:** All imported reviews get a verified badge

✅ **Professional Display:** Same beautiful card design as direct reviews

---

## 🛡️ Best Practices

### ✅ DO:
- Copy reviews exactly as written (don't edit)
- Include the original posting date
- Use unique Source Review IDs to prevent duplicates
- Import both positive and negative reviews (builds trust)
- Update regularly (monthly is good)
- Keep a spreadsheet of imported reviews

### ❌ DON'T:
- Edit or modify review text
- Cherry-pick only 5-star reviews
- Fake reviews (this is illegal!)
- Import the same review twice
- Change reviewer names
- Import reviews for the wrong property

---

## 🔍 Prevent Duplicates

The system automatically prevents duplicates using **Source Review ID**:

```
If you try to import:
- Google review with ID: google_123456
- And it already exists in database
- System will skip it and show "Duplicate" error
```

**Best Practice:** Always use meaningful Source Review IDs:
- `google_<review_url_id>`
- `booking_<booking_reference>`
- `airbnb_<reservation_code>`
- `mmt_<booking_number>`

---

## 📊 Monitor Your Reviews

### View All Reviews:
1. Go to **Admin → Reviews**
2. See all imported and direct reviews
3. Filter by source platform
4. Check statistics

### Key Metrics:
- Total reviews
- Average rating
- Reviews by platform
- Pending vs Published

---

## 🚀 Quick Start Example

Let's import 3 reviews right now:

### Review 1 (Google):
```
Guest Name: Amit Kumar
Rating: 5
Comment: Absolutely loved our stay! The property exceeded expectations. Clean, spacious, and the location was perfect. Will definitely book again!
Source: Google
Source Review ID: google_20241101_1
Review Date: 2024-11-01
```

### Review 2 (Booking.com):
```
Guest Name: Emma from USA
Rating: 4
Comment: Great property with excellent amenities. The staff was friendly and helpful. Only issue was the WiFi speed could be better.
Source: Booking.com
Source Review ID: booking_987654
Review Date: 2024-10-28
```

### Review 3 (Airbnb):
```
Guest Name: Rajesh
Rating: 5
Comment: Perfect for our family vacation! Kids loved the space and we enjoyed the peaceful surroundings. Host was very accommodating.
Source: Airbnb
Source Review ID: airbnb_HM789012
Review Date: 2024-10-25
```

**Steps:**
1. Go to `/admin/reviews/import`
2. Select your property
3. Fill in Review 1 details
4. Click "+ Add Another Review"
5. Fill in Review 2 details
6. Click "+ Add Another Review"
7. Fill in Review 3 details
8. Click "Import 3 Review(s)"
9. ✅ Done! Check your property page

---

## 🔄 Maintenance Schedule

**Weekly:**
- Check for new reviews on Google
- Quick scan of Booking.com extranet

**Monthly:**
- Import all new reviews from all platforms
- Update review statistics
- Respond to new reviews

**Quarterly:**
- Audit all imported reviews
- Verify source badges display correctly
- Check for duplicate entries

---

## 🆘 Troubleshooting

### Problem: "Failed to import reviews"
**Solution:** Check internet connection, ensure property is selected

### Problem: "Duplicate review"
**Solution:** This review already exists. Change the Source Review ID or skip it.

### Problem: Reviews not showing on property page
**Solution:** Make sure `isPublished` is true. Check admin reviews page.

### Problem: Wrong source badge showing
**Solution:** Edit the review and correct the "Source" field

### Problem: Can't find review source
**Solution:** Use "Other/Imported" option and add notes in the comment

---

## 📈 Next Steps (Future Phases)

### Phase 2: Google Places API Integration
- Automatically fetch Google reviews
- Update every 24 hours
- Costs: ~$0.017 per fetch

### Phase 3: Smart Scraping
- Automated collection from multiple platforms
- Scheduled imports
- AI-powered duplicate detection

---

## 💡 Tips for Success

1. **Start Small:** Import 5-10 recent reviews first
2. **Mix Platforms:** Show reviews from multiple sources for credibility
3. **Include Lower Ratings:** A few 4-star reviews look more authentic than all 5-stars
4. **Update Regularly:** Fresh reviews = active business
5. **Respond to Reviews:** Use the admin panel to add host responses
6. **Track Performance:** Monitor which platform brings most bookings

---

## 📞 Need Help?

- Check the Admin Dashboard for statistics
- Use "Load Example Reviews" to see proper formatting
- Keep reviews authentic and unedited
- When in doubt, copy exactly as written on the platform

---

## ✨ Benefits of Manual Import

✅ **Immediate Results:** Start showing social proof today
✅ **Zero Cost:** No API fees or technical setup
✅ **Full Control:** Choose which reviews to display
✅ **Legal & Safe:** You own the data you copy
✅ **Builds Trust:** Multi-platform reviews = credibility
✅ **SEO Boost:** More content = better rankings

---

## 📝 Legal Note

**You CAN:**
- Copy reviews from platforms where your property is listed
- Display them on your own website with proper attribution
- Show the platform source (we do this with badges)

**You CANNOT:**
- Claim the reviews are from your website
- Edit or modify review content
- Remove platform attribution
- Create fake reviews

Our system displays source badges (⭐ Google, 🏨 Booking.com, etc.) to maintain transparency and comply with consumer protection laws.

---

**Happy Importing! 🎉**

Your reviews will help build trust and increase bookings. Start with your best reviews from each platform!
