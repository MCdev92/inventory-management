'use client'

import { useState, useEffect } from 'react';
import { Box, Stack, Typography, Button, Modal, TextField, Paper, IconButton } from '@mui/material';
import { firestore, storage } from '@/firebase.js'; // Corrected import path
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState(1);
  const [itemImage, setItemImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() });
    });
    setInventory(inventoryList);
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const handleImageUpload = (e) => {
    setItemImage(e.target.files[0]);
  };

  const addItem = async (item, amount, image) => {
    let imageUrl = '';
    if (image) {
      const imageRef = ref(storage, `images/${image.name}`);
      await uploadBytes(imageRef, image);
      imageUrl = await getDownloadURL(imageRef);
    }

    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + amount, imageUrl }, { merge: true });
    } else {
      await setDoc(docRef, { quantity: amount, imageUrl });
    }
    await updateInventory();
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }
    await updateInventory();
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      justifyContent="center"
      flexDirection="column"
      alignItems="center"
      gap={2}
    >
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Add Item
          </Typography>
          <Stack width="100%" spacing={2}>
            <TextField
              id="outlined-basic"
              label="Item"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <TextField
              id="outlined-amount"
              label="Amount"
              variant="outlined"
              type="number"
              fullWidth
              value={itemAmount}
              onChange={(e) => setItemAmount(parseInt(e.target.value, 10))}
            />
            <Button
              variant="outlined"
              component="label"
              fullWidth
            >
              Upload Image
              <input
                type="file"
                hidden
                onChange={handleImageUpload}
              />
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                addItem(itemName, itemAmount, itemImage);
                setItemName('');
                setItemAmount(1);
                setItemImage(null);
                handleClose();
              }}
              fullWidth
            >
              Add Item
            </Button>
          </Stack>
        </Box>
      </Modal>
      <TextField
        id="search-bar"
        label="Search"
        variant="outlined"
        fullWidth
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ marginBottom: 2, width: '10%' }}
      />
      <Button variant="contained" onClick={handleOpen} sx={{ mb: 2 }}>
        Add New Item
      </Button>
      <Box border="1px solid #333" borderRadius={4} padding={2} width="800px">
        <Box
          width="100%"
          bgcolor="#ADD8E6"
          display="flex"
          justifyContent="center"
          alignItems="center"
          borderRadius={2}
          mb={2}
        >
          <Typography variant="h5" color="#333" textAlign="center">
            Pantry Tracker
          </Typography>
        </Box>
        <Stack spacing={2}>
          {filteredInventory.map(({ name, quantity, imageUrl }) => (
            <Paper elevation={3} key={name} style={{ padding: '10px' }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box display="flex" alignItems="center" gap={2}>
                  {imageUrl && <img src={imageUrl} alt={name} style={{ width: 50, height: 50, objectFit: 'cover' }} />}
                  <Typography variant="h6" color="#333">
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                </Box>
                <Typography variant="h6" color="#333">
                  Quantity: {quantity}
                </Typography>
                <Box display="flex" alignItems="center">
                  <IconButton onClick={() => addItem(name, 1)}>
                    <AddIcon />
                  </IconButton>
                  <IconButton onClick={() => removeItem(name)}>
                    <RemoveIcon />
                  </IconButton>
                  <Button variant="contained" color="secondary" onClick={() => removeItem(name)}>
                    Remove
                  </Button>
                </Box>
              </Box>
            </Paper>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
