import { useState, useEffect } from 'react';
import { storage, auth, db, } from '../components/firebase';
import {ref, getDownloadURL, uploadBytesResumable} from 'firebase/storage';
import { serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';


const uploadImage = (file : File | null) =>{
    const [url, setURL] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const user = auth.currentUser;

    useEffect(() => {
        if (!file || !user) {
            return;
        }
        const imageRef = ref(storage, 'images/' + user.uid + '/' + file.name);
        const uploadTask = uploadBytesResumable(imageRef, file);
        uploadTask.on('state_changed', (snapshot) => {
            const percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(percentage);
        },  (error) => {
            toast.error(`Error uploading image: ${error.message}`, {
                position: "bottom-center",
            });
        }, async () => {
            try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                const collectionRef = collection(db, 'Users', user.uid, 'images');
                await addDoc(collectionRef, {
                    url: downloadUrl,
                    userId: user.uid,
                    createdAt: serverTimestamp(),
                    fileName: file.name,
                })
                setURL(downloadUrl);
                toast.success('Image uploaded successfully!', {
                    position: "top-center",
                });
            } catch (error) {
                toast.error(`Error saving image URL: ${error.message}`, {
                    position: "bottom-center",
                });
            }
        });
    }, [file])
    return {progress, url}

}

export default uploadImage;
