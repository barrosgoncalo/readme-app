// @readme/shared/src/models/user.js


export const createUserModel = (uid, profileData, provider) => {
    return {
        uid: uid,
        userId: profileData.email.trim().toLowerCase(),
        username: profileData.username,
        fullName: profileData.fullName,
        phoneNumber: profileData.phoneNumber || null,
        dob: profileData.dob,
        profileVisibility: profileData.isPublic ? 'public' : 'private',
        
        institutionalAddress: {
            addressLine1: profileData.addressLine1,
            addressLine2: profileData.addressLine2 || null,
            city: profileData.city,
            district: profileData.district,
            postalCode: profileData.zipCode,
            country: profileData.country
        },

        rating: 0,
        reviewCount: 0,
        favoriteBooks: [],

        createdAt: new Date().toISOString(),
        photoURL: profileData.photoURL || null,
        role: 'user',
        accountStatus: 'active',
        
        notificationSettings: {
            pushEnabled: false,
            emailEnabled: false,
            newFollowers: false,
            marketingUpdates: false,
        },

        authProvider: provider
    };
};
