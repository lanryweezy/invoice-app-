import re

with open('apps/web/components/SettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the specific block of code
target = """      const payload = {
        username: sanitizedUsername,
        bio,
        businessName,
        website,
        isPublic,
        email: user.email,
        uid: user.uid
      };

      // 2. Save to internal users document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, payload);

      // 3. Write new public profile and cleanup old one if it changed
      const { setDoc, deleteDoc } = await import('firebase/firestore');

      if (sanitizedUsername) {
         const publicRef = doc(db, 'publicProfiles', sanitizedUsername);
         await setDoc(publicRef, payload);
      }

      // Cleanup dangling old profile if username changed and old username existed
      if (originalUsername && originalUsername !== sanitizedUsername) {
          const oldPublicRef = doc(db, 'publicProfiles', originalUsername);
          await deleteDoc(oldPublicRef);
      }

      setOriginalUsername(sanitizedUsername); // Sync up after successful save"""

replacement = """      const payload = {
        username: sanitizedUsername,
        bio,
        businessName,
        website,
        isPublic,
        email: user.email,
        uid: user.uid
      };

      // 2. Execute multi-step save atomically
      const batch = writeBatch(db);

      // Update internal users document
      const userDocRef = doc(db, 'users', user.uid);
      batch.update(userDocRef, payload);

      // Write new public profile
      if (sanitizedUsername) {
         const publicRef = doc(db, 'publicProfiles', sanitizedUsername);
         batch.set(publicRef, payload);
      }

      // Cleanup dangling old profile if username changed and old username existed
      if (originalUsername && originalUsername !== sanitizedUsername) {
          const oldPublicRef = doc(db, 'publicProfiles', originalUsername);
          batch.delete(oldPublicRef);
      }

      // Commit all changes or none
      await batch.commit();

      setOriginalUsername(sanitizedUsername); // Sync up after successful save"""

# Use regex to ignore line endings differences
import re
target_regex = re.escape(target).replace(r'\n', r'\r?\n')

content_new = re.sub(target_regex, replacement.replace('\n', '\r\n'), content)

if content == content_new:
    print("No change made")
else:
    with open('apps/web/components/SettingsModal.tsx', 'w', encoding='utf-8') as f:
        f.write(content_new)
    print("File updated successfully")
