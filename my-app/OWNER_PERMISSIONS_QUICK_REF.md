# 🔒 Owner Permissions - Quick Reference Card

**Print this and keep it handy!**

---

## ❌ What Owners CANNOT Do

```
❌ Add properties to their account
❌ Remove properties from their account
❌ Transfer properties to other owners
❌ Change property ownership (ownerId)
❌ Access properties not assigned to them
❌ Modify ownerProfile.propertyIds
❌ Grant themselves admin access
❌ View other owners' properties
❌ Assign properties to themselves
```

**WHY:** Admin-only control prevents data conflicts

---

## ✅ What Owners CAN Do

```
✅ View properties assigned by admin
✅ Update property details (title, description, price)
✅ Manage rooms within their properties
✅ Manage bookings for their properties
✅ Collect payments from guests
✅ View revenue reports
✅ Communicate with guests
✅ Update amenities and facilities
✅ Upload property images
✅ Manage availability
```

**WHY:** Operational control without security risks

---

## 🔐 Security Status

| Feature | Status |
|---------|--------|
| Property Assignment | ✅ Admin-Only |
| Owner Profile Update | ✅ Read-Only |
| Property ownerId Field | ✅ Protected |
| API Endpoints | ✅ Validated |
| Access Control | ✅ Enforced |

---

## 👥 Who Can Do What

```
PROPERTY ASSIGNMENT:
├─ Create Owner → Admin Only
├─ Assign Properties → Admin Only
├─ Remove Properties → Admin Only
└─ Change Ownership → Admin Only

PROPERTY MANAGEMENT:
├─ Update Details → Owner (assigned properties)
├─ Manage Rooms → Owner (assigned properties)
├─ Handle Bookings → Owner (assigned properties)
└─ View Reports → Owner (assigned properties)
```

---

## 🛡️ How It's Protected

```
1. No Owner API → Cannot update profile
2. Field Whitelist → ownerId blocked
3. Access Validation → Ownership checked
4. Admin Auth → Assignment requires admin
5. Role Check → property_owner limited
```

---

## 📞 Quick Answers

**Q: Can owner add property?**
A: ❌ No. Only admin can.

**Q: Can owner see all properties?**
A: ❌ No. Only assigned ones.

**Q: Can owner remove property?**
A: ❌ No. Only admin can.

**Q: Can owner update property info?**
A: ✅ Yes. Title, price, amenities, etc.

**Q: Can owner change property owner?**
A: ❌ No. ownerId is protected.

---

## 🚨 If Owner Asks...

**"I want to add a new property"**
→ Direct them to admin for assignment

**"I can't see my property"**
→ Check if admin assigned it

**"I want to transfer property"**
→ Admin must do the transfer

**"Can I manage another property?"**
→ Admin must assign it first

---

**Status:** ✅ Secure
**Last Updated:** Dec 23, 2025
**Keep this card for reference!**
