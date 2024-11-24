<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $uploadDir = 'uploads/';
    
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $file = $_FILES['company-documents'];
    $allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    
    if (in_array($file['type'], $allowedTypes) && $file['size'] <= 10485760) {
        $fileName = basename($file['name']);
        $targetFile = $uploadDir . $fileName;

        if (move_uploaded_file($file['tmp_name'], $targetFile)) {
            echo "File successfully uploaded.<br>";
            $fileContent = file_get_contents($targetFile);
            $fileHash = hash('sha256', $fileContent);

            echo "File Hash: " . $fileHash . "<br>";
            echo "Store this hash in a database for future verification.";
        } else {
            echo "Error uploading file.";
        }
    } else {
        echo "Invalid file type or file is too large.";
    }
}
?>
