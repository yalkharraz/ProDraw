// Get references to canvas and toolbar elements
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const toolPicker = document.getElementById('toolPicker');
const backgroundUpload = document.getElementById('backgroundUpload');
const fillShapeBtn = document.getElementById('fillShapeBtn');

// Set canvas dimensions
canvas.width = window.innerWidth * 0.9; // 90% of window width
canvas.height = window.innerHeight * 0.8; // 80% of window height

// Variables to track drawing state
let isDrawing = false;
let startX = 0;
let startY = 0;
let selectedTool = 'draw'; // Default tool
let undoStack = [];
let redoStack = [];
let isFillShape = false; // Toggle for filled shapes

// Initialize the canvas with a white background
function initializeCanvas() {
  ctx.fillStyle = "#ffffff"; // Default background color
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the canvas
  saveState(); // Save the initial blank state
}
initializeCanvas();

// Save canvas state
function saveState() {
  undoStack.push(canvas.toDataURL());
  if (undoStack.length > 20) {
    undoStack.shift(); // Limit stack size to avoid memory issues
  }
  redoStack = []; // Clear redo stack on new action
}

// Restore canvas from a given image
function restoreState(state) {
  const img = new Image();
  img.src = state;
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    ctx.drawImage(img, 0, 0); // Redraw saved state
  };
}

// Set background image
function setBackground(imageFile) {
  const img = new Image();
  img.src = URL.createObjectURL(imageFile);
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw the image as the background
    saveState(); // Save the new background state
  };
}

// Set background color
function setBackgroundColor(color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the entire canvas with the chosen color
  saveState();
}

// Tool selection event listener
toolPicker.addEventListener('change', (e) => {
  selectedTool = e.target.value;
});

// Toggle filled shapes
fillShapeBtn.addEventListener('click', () => {
  isFillShape = !isFillShape;
  fillShapeBtn.textContent = isFillShape ? 'Fill: On' : 'Fill: Off';
});

// Event listeners for drawing and shapes
canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  startX = e.offsetX;
  startY = e.offsetY;

  if (selectedTool !== 'draw' && selectedTool !== 'eraser') {
    saveState(); // Save state before starting a shape
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (isDrawing) {
    if (selectedTool === 'draw' || selectedTool === 'eraser') {
      // Freehand drawing or erasing
      ctx.strokeStyle = selectedTool === 'eraser' ? "#ffffff" : colorPicker.value;
      ctx.lineWidth = brushSize.value;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();

      startX = e.offsetX;
      startY = e.offsetY;
    } else if (selectedTool === 'rectangle' || selectedTool === 'circle') {
      // Preview shapes
      if (undoStack.length > 0) {
        const previewState = undoStack[undoStack.length - 1];
        const img = new Image();
        img.src = previewState;
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          const endX = e.offsetX;
          const endY = e.offsetY;

          ctx.strokeStyle = colorPicker.value;
          ctx.lineWidth = brushSize.value;

          if (selectedTool === 'rectangle') {
            if (isFillShape) {
              ctx.fillStyle = colorPicker.value;
              ctx.fillRect(startX, startY, endX - startX, endY - startY);
            } else {
              ctx.strokeRect(startX, startY, endX - startX, endY - startY);
            }
          } else if (selectedTool === 'circle') {
            const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            ctx.beginPath();
            if (isFillShape) {
              ctx.fillStyle = colorPicker.value;
              ctx.arc(startX, startY, radius, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.arc(startX, startY, radius, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        };
      }
    }
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (isDrawing) {
    isDrawing = false;

    if (selectedTool === 'rectangle' || selectedTool === 'circle') {
      const endX = e.offsetX;
      const endY = e.offsetY;

      ctx.strokeStyle = colorPicker.value;
      ctx.lineWidth = brushSize.value;

      if (selectedTool === 'rectangle') {
        if (isFillShape) {
          ctx.fillStyle = colorPicker.value;
          ctx.fillRect(startX, startY, endX - startX, endY - startY);
        } else {
          ctx.strokeRect(startX, startY, endX - startX, endY - startY);
        }
      } else if (selectedTool === 'circle') {
        const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        ctx.beginPath();
        if (isFillShape) {
          ctx.fillStyle = colorPicker.value;
          ctx.arc(startX, startY, radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.arc(startX, startY, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      saveState(); // Save the final shape to the undo stack
    }
  }
});

// Undo button functionality
undoBtn.addEventListener('click', () => {
  if (undoStack.length > 0) {
    redoStack.push(undoStack.pop()); // Move last state to redo stack
    if (undoStack.length > 0) {
      restoreState(undoStack[undoStack.length - 1]); // Restore last undo state
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas if no states left
    }
  }
});

// Redo button functionality
redoBtn.addEventListener('click', () => {
  if (redoStack.length > 0) {
    const state = redoStack.pop();
    undoStack.push(state); // Move back to undo stack
    restoreState(state); // Restore redo state
  }
});

// Clear canvas functionality
clearBtn.addEventListener('click', () => {
  const backgroundColor = colorPicker.value; // Use selected color
  setBackgroundColor(backgroundColor);
});

// Save canvas as an image
saveBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'drawing.png'; // Set the filename
  link.href = canvas.toDataURL('image/png'); // Convert canvas to PNG
  link.click(); // Trigger the download
});

// Export canvas as PDF
exportPdfBtn.addEventListener('click', () => {
  const pdf = new jsPDF();
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, 190, 140);
  pdf.save('drawing.pdf');
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'z') {
    undoBtn.click(); // Undo
  } else if (e.ctrlKey && e.key === 'y') {
    redoBtn.click(); // Redo
  } else if (e.key.toLowerCase() === 'c') {
    clearBtn.click(); // Clear canvas
  } else if (e.key.toLowerCase() === 's') {
    saveBtn.click(); // Save as image
  }
});

// Event listener for background upload
backgroundUpload.addEventListener('change', (e) => {
  setBackground(e.target.files[0]);
});

let uploadedImage = null; // Reference to the uploaded image
let isDraggingImage = false; // Dragging state
let imageX = 0, imageY = 0; // Image position
let offsetX = 0, offsetY = 0; // Offset for drag

function setBackground(imageFile) {
  const img = new Image();
  img.src = URL.createObjectURL(imageFile);
  img.onload = () => {
    uploadedImage = img;
    imageX = 0; // Initial position
    imageY = 0;
    redrawCanvas(); // Draw the image on the canvas
  };
}

function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
  ctx.fillStyle = "#ffffff"; // Background color
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (uploadedImage) {
    ctx.drawImage(uploadedImage, imageX, imageY, uploadedImage.width, uploadedImage.height);
  }
}

// Dragging events for the image
canvas.addEventListener('mousedown', (e) => {
  if (uploadedImage) {
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;

    // Check if mouse is over the image
    if (
      mouseX >= imageX &&
      mouseX <= imageX + uploadedImage.width &&
      mouseY >= imageY &&
      mouseY <= imageY + uploadedImage.height
    ) {
      isDraggingImage = true;
      offsetX = mouseX - imageX;
      offsetY = mouseY - imageY;
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (isDraggingImage) {
    imageX = e.offsetX - offsetX;
    imageY = e.offsetY - offsetY;
    redrawCanvas();
  }
});

canvas.addEventListener('mouseup', () => {
  isDraggingImage = false;
});

let isSelecting = false; // Selection state
let selectionStartX = 0, selectionStartY = 0; // Selection start point
let selectionWidth = 0, selectionHeight = 0; // Selection dimensions
let selectedImageData = null; // Selected content

canvas.addEventListener('mousedown', (e) => {
  if (selectedTool === 'select') {
    isSelecting = true;
    selectionStartX = e.offsetX;
    selectionStartY = e.offsetY;
    selectionWidth = 0;
    selectionHeight = 0;
    selectedImageData = null; // Reset selection
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (isSelecting) {
    selectionWidth = e.offsetX - selectionStartX;
    selectionHeight = e.offsetY - selectionStartY;

    redrawCanvas();

    // Draw the selection box
    ctx.strokeStyle = "rgba(0, 0, 255, 0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(selectionStartX, selectionStartY, selectionWidth, selectionHeight);
  }
});

canvas.addEventListener('mouseup', () => {
  if (isSelecting) {
    isSelecting = false;

    // Copy selected content
    selectedImageData = ctx.getImageData(
      selectionStartX,
      selectionStartY,
      selectionWidth,
      selectionHeight
    );

    // Clear the selected area
    ctx.clearRect(
      selectionStartX,
      selectionStartY,
      selectionWidth,
      selectionHeight
    );
  }
});

canvas.addEventListener('mousedown', (e) => {
  if (selectedImageData) {
    // Place selected content at new position
    const destX = e.offsetX;
    const destY = e.offsetY;

    ctx.putImageData(selectedImageData, destX, destY);
    selectedImageData = null; // Clear selection
    redrawCanvas();
  }
});
