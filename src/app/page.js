'use client' // Indicates that the component is a client-side React component

import { useState, useEffect } from 'react'; // React hooks for state management and side effects
import { Box, Grid, Typography, Button, Modal, TextField, Paper, IconButton } from '@mui/material'; // MUI components for UI elements
import { firestore, storage } from '@/firebase.js'; // Importing Firestore and Storage from Firebase

import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore'; // Firestore functions for CRUD operations

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase Storage functions for file uploads

import AddIcon from '@mui/icons-material/Add'; // MUI icon for adding items
import RemoveIcon from '@mui/icons-material/Remove'; // MUI icon for removing items

// CSS style object for the Modal component
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 400,
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

// Main component function
export default function Home() {
  // State variables for inventory data, modal visibility, form inputs, and search query
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState(1);
  const [itemImage, setItemImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Function to fetch inventory data from Firestore and update state
  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() });
    });
    setInventory(inventoryList);
  };

  // useEffect hook to fetch inventory data on component mount
  useEffect(() => {
    updateInventory();
  }, []);

  // Event handler for image upload input
  const handleImageUpload = (e) => {
    setItemImage(e.target.files[0]);
  };

  // Function to add a new item to the inventory
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

  // Function to remove an item from the inventory
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

  // Event handlers for opening and closing the modal
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Filter the inventory based on the search query
  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render the component
  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      justifyContent="center"
      flexDirection="column"
      alignItems="center"
      gap={2}
      sx={{ p: 2 }}
    >
      {/* Modal for adding new items */}
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
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                id="outlined-basic"
                label="Item"
                variant="outlined"
                fullWidth
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="outlined-amount"
                label="Amount"
                variant="outlined"
                type="number"
                fullWidth
                value={itemAmount}
                onChange={(e) => setItemAmount(parseInt(e.target.value, 10))}
              />
            </Grid>
            <Grid item xs={12}>
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
            </Grid>
            <Grid item xs={12}>
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
            </Grid>
          </Grid>
        </Box>
      </Modal>

      {/* Search bar */}
      <TextField
        id="search-bar"
        label="Search"
        variant="outlined"
        fullWidth
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2, maxWidth: '200px' }}
      />
      <Button variant="contained" onClick={handleOpen} sx={{ mb: 2 }}>
        Add New Item
      </Button>

      {/* Inventory display */}
      <Box
        border="1px solid #333"
        borderRadius={4}
        padding={2}
        width="90%"
        maxWidth="800px"
        sx={{ overflowY: 'auto', maxHeight: '60vh' }}
      >
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
        <Grid container spacing={2}>
          {filteredInventory.map(({ name, quantity, imageUrl }) => (
            <Grid item xs={12} key={name}>
              <Paper elevation={3} style={{ padding: '10px' }}>
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
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
