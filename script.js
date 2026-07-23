

document.addEventListener('DOMContentLoaded', () => {
    
   
    const STORAGE_KEY = 'contacthub_contacts';
    let contacts = loadContactsFromStorage();
    let currentPhotoBase64 = '';
    
   
    const contactModalElement = document.getElementById('contactModal');
    const contactModal = new bootstrap.Modal(contactModalElement);

    // DOM Element References
    const contactForm = document.getElementById('contactForm');
    const modalTitle = document.getElementById('modalTitle');
    const contactIdInput = document.getElementById('contactId');
    const fullNameInput = document.getElementById('fullName');
    const phoneNumberInput = document.getElementById('phoneNumber');
    const emailAddressInput = document.getElementById('emailAddress');
    const addressInput = document.getElementById('address');
    const groupSelect = document.getElementById('group');
    const notesInput = document.getElementById('notes');
    const isFavoriteCheckbox = document.getElementById('isFavorite');
    const isEmergencyCheckbox = document.getElementById('isEmergency');
    
    const photoInput = document.getElementById('photoInput');
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const avatarPreview = document.getElementById('avatarPreview');

    const searchInput = document.getElementById('searchInput');
    const contactsGrid = document.getElementById('contactsGrid');
    const emptyContactsState = document.getElementById('emptyContactsState');
    const contactsSubtitle = document.getElementById('contactsSubtitle');

    const favoritesList = document.getElementById('favoritesList');
    const emptyFavState = document.getElementById('emptyFavState');
    const emergencyList = document.getElementById('emergencyList');
    const emptyEmergencyState = document.getElementById('emptyEmergencyState');

    const totalCountEl = document.getElementById('totalCount');
    const favCountEl = document.getElementById('favCount');
    const emergencyCountEl = document.getElementById('emergencyCount');
    const openAddModalBtn = document.getElementById('openAddModalBtn');

  
    initApp();

    function initApp() {
        renderAll();

     
        searchInput.addEventListener('input', () => {
            renderContacts(searchInput.value.trim());
        });

      
        openAddModalBtn.addEventListener('click', () => {
            resetForm();
            modalTitle.textContent = 'Add New Contact';
            contactModal.show();
        });

      
        changePhotoBtn.addEventListener('click', () => {
            photoInput.click();
        });

       
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    currentPhotoBase64 = event.target.result;
                    renderAvatarPreview(currentPhotoBase64);
                };
                reader.readAsDataURL(file);
            }
        });

      
        contactForm.addEventListener('submit', handleFormSubmit);

      
        contactModalElement.addEventListener('hidden.bs.modal', resetForm);
    }

    
    function loadContactsFromStorage() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    function saveContactsToStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    }

   

    function renderAll() {
        renderContacts(searchInput.value.trim());
        renderSidePanels();
        updateStatistics();
    }

    function updateStatistics() {
        const total = contacts.length;
        const favorites = contacts.filter(c => c.isFavorite).length;
        const emergency = contacts.filter(c => c.isEmergency).length;

        totalCountEl.textContent = total;
        favCountEl.textContent = favorites;
        emergencyCountEl.textContent = emergency;

        contactsSubtitle.textContent = `Manage and organize your ${total} contacts`;
    }

    function renderContacts(searchTerm = '') {
        contactsGrid.innerHTML = '';

        let filtered = contacts;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = contacts.filter(c => 
                c.fullName.toLowerCase().includes(term) ||
                c.phoneNumber.toLowerCase().includes(term) ||
                (c.emailAddress && c.emailAddress.toLowerCase().includes(term))
            );
        }

        if (filtered.length === 0) {
            emptyContactsState.classList.remove('d-none');
            return;
        } else {
            emptyContactsState.classList.add('d-none');
        }

        filtered.forEach(contact => {
            const col = document.createElement('div');
            col.className = 'col-12 col-md-6';
            col.innerHTML = createContactCardHTML(contact);
            contactsGrid.appendChild(col);
        });

        attachCardActionListeners();
    }

    function createContactCardHTML(contact) {
        const initials = getInitials(contact.fullName);
        const avatarHTML = contact.photo 
            ? `<img src="${contact.photo}" alt="${contact.fullName}">`
            : initials;

        const emergencyBadge = contact.isEmergency 
            ? `<div class="avatar-badge-emergency" title="Emergency Contact"><i class="fa-solid fa-heart-pulse"></i></div>` 
            : '';

        const tagsHTML = `
            <div class="d-flex flex-wrap align-items-center gap-1">
                ${contact.isEmergency ? `<span class="badge-tag badge-tag-emergency"><i class="fa-solid fa-heart-pulse"></i> Emergency</span>` : ''}
                ${contact.isFavorite ? `<span class="badge-tag badge-tag-fav"><i class="fa-solid fa-star"></i> Favorite</span>` : ''}
                ${contact.group ? `<span class="badge-tag badge-tag-group"><i class="fa-solid fa-folder"></i> ${contact.group}</span>` : ''}
            </div>
        `;

        return `
            <div class="contact-card" data-id="${contact.id}">
                <div>
                    <div class="d-flex align-items-center gap-3 mb-3">
                        <div class="contact-avatar">
                            ${avatarHTML}
                            ${emergencyBadge}
                        </div>
                        <div class="overflow-hidden">
                            <h3 class="contact-name text-truncate">${escapeHTML(contact.fullName)}</h3>
                            <div class="contact-info-item text-muted mt-1">
                                <i class="fa-solid fa-phone text-blue-icon"></i>
                                <span>${escapeHTML(contact.phoneNumber)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="contact-info-list">
                        ${contact.emailAddress ? `
                            <div class="contact-info-item">
                                <i class="fa-solid fa-envelope text-purple-icon"></i>
                                <span class="text-truncate">${escapeHTML(contact.emailAddress)}</span>
                            </div>
                        ` : ''}
                        
                        ${contact.address ? `
                            <div class="contact-info-item">
                                <i class="fa-solid fa-location-dot text-green-icon"></i>
                                <span class="text-truncate">${escapeHTML(contact.address)}</span>
                            </div>
                        ` : ''}
                    </div>

                    ${tagsHTML}
                </div>

                <div class="card-actions-bar">
                    <a href="tel:${contact.phoneNumber}" class="btn-action-icon btn-action-call" title="Call">
                        <i class="fa-solid fa-phone"></i>
                    </a>
                    
                    ${contact.emailAddress ? `
                        <a href="mailto:${contact.emailAddress}" class="btn-action-icon btn-action-mail" title="Email">
                            <i class="fa-solid fa-envelope"></i>
                        </a>
                    ` : ''}

                    <button class="btn-action-icon btn-toggle-fav ${contact.isFavorite ? 'active-star' : ''}" title="Toggle Favorite">
                        <i class="${contact.isFavorite ? 'fa-solid' : 'fa-regular'} fa-star"></i>
                    </button>

                    <button class="btn-action-icon btn-toggle-emergency ${contact.isEmergency ? 'active-heart' : ''}" title="Toggle Emergency">
                        <i class="${contact.isEmergency ? 'fa-solid' : 'fa-regular'} fa-heart-pulse"></i>
                    </button>

                    <button class="btn-action-icon btn-edit-contact ms-auto" title="Edit">
                        <i class="fa-solid fa-pen"></i>
                    </button>

                    <button class="btn-action-icon btn-delete-contact" title="Delete">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
    }

    function renderSidePanels() {
       
        const favorites = contacts.filter(c => c.isFavorite);
        favoritesList.innerHTML = '';
        if (favorites.length === 0) {
            emptyFavState.classList.remove('d-none');
        } else {
            emptyFavState.classList.add('d-none');
            favorites.forEach(c => {
                const item = document.createElement('div');
                item.className = 'side-item';
                const avatarHTML = c.photo ? `<img src="${c.photo}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : getInitials(c.fullName);
                item.innerHTML = `
                    <div class="side-item-left">
                        <div class="side-item-avatar">${avatarHTML}</div>
                        <div>
                            <h4 class="side-item-name">${escapeHTML(c.fullName)}</h4>
                            <p class="side-item-phone">${escapeHTML(c.phoneNumber)}</p>
                        </div>
                    </div>
                    <a href="tel:${c.phoneNumber}" class="btn-action-icon btn-action-call" title="Call">
                        <i class="fa-solid fa-phone"></i>
                    </a>
                `;
                favoritesList.appendChild(item);
            });
        }

     
        const emergencies = contacts.filter(c => c.isEmergency);
        emergencyList.innerHTML = '';
        if (emergencies.length === 0) {
            emptyEmergencyState.classList.remove('d-none');
        } else {
            emptyEmergencyState.classList.add('d-none');
            emergencies.forEach(c => {
                const item = document.createElement('div');
                item.className = 'side-item';
                const avatarHTML = c.photo ? `<img src="${c.photo}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : getInitials(c.fullName);
                item.innerHTML = `
                    <div class="side-item-left">
                        <div class="side-item-avatar">${avatarHTML}</div>
                        <div>
                            <h4 class="side-item-name">${escapeHTML(c.fullName)}</h4>
                            <p class="side-item-phone">${escapeHTML(c.phoneNumber)}</p>
                        </div>
                    </div>
                    <a href="tel:${c.phoneNumber}" class="btn-action-icon btn-action-call text-red bg-red-soft" title="Emergency Call">
                        <i class="fa-solid fa-phone"></i>
                    </a>
                `;
                emergencyList.appendChild(item);
            });
        }
    }

    
    function attachCardActionListeners() {
        document.querySelectorAll('.contact-card').forEach(card => {
            const id = card.getAttribute('data-id');

          
            card.querySelector('.btn-toggle-fav')?.addEventListener('click', () => {
                toggleFavorite(id);
            });

            
            card.querySelector('.btn-toggle-emergency')?.addEventListener('click', () => {
                toggleEmergency(id);
            });

           
            card.querySelector('.btn-edit-contact')?.addEventListener('click', () => {
                openEditModal(id);
            });

            
            card.querySelector('.btn-delete-contact')?.addEventListener('click', () => {
                confirmDeleteContact(id);
            });
        });
    }

    function toggleFavorite(id) {
        const index = contacts.findIndex(c => c.id === id);
        if (index !== -1) {
            contacts[index].isFavorite = !contacts[index].isFavorite;
            saveContactsToStorage();
            renderAll();
        }
    }

    function toggleEmergency(id) {
        const index = contacts.findIndex(c => c.id === id);
        if (index !== -1) {
            contacts[index].isEmergency = !contacts[index].isEmergency;
            saveContactsToStorage();
            renderAll();
        }
    }

    
    function handleFormSubmit(e) {
        e.preventDefault();

        const id = contactIdInput.value;
        const fullName = fullNameInput.value.trim();
        const phoneNumber = phoneNumberInput.value.trim();
        const emailAddress = emailAddressInput.value.trim();
        const address = addressInput.value.trim();
        const group = groupSelect.value;
        const notes = notesInput.value.trim();
        const isFavorite = isFavoriteCheckbox.checked;
        const isEmergency = isEmergencyCheckbox.checked;

       
        if (!fullName) {
            showValidationError('Full Name is required!');
            return;
        }

        if (!phoneNumber) {
            showValidationError('Phone Number is required!');
            return;
        }

       
        const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,8}$/;
        if (!phoneRegex.test(phoneNumber.replace(/\s+/g, ''))) {
            showValidationError('Please enter a valid phone number format!');
            return;
        }

       
        if (emailAddress) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailAddress)) {
                showValidationError('Please enter a valid email address!');
                return;
            }
        }

        
        const isDuplicatePhone = contacts.some(c => c.phoneNumber.replace(/\s+/g, '') === phoneNumber.replace(/\s+/g, '') && c.id !== id);
        if (isDuplicatePhone) {
            showValidationError('A contact with this phone number already exists!');
            return;
        }

        if (id) {
          
            const index = contacts.findIndex(c => c.id === id);
            if (index !== -1) {
                contacts[index] = {
                    ...contacts[index],
                    fullName,
                    phoneNumber,
                    emailAddress,
                    address,
                    group,
                    notes,
                    isFavorite,
                    isEmergency,
                    photo: currentPhotoBase64 || contacts[index].photo
                };
                saveContactsToStorage();
                renderAll();
                contactModal.hide();
                Swal.fire({
                    icon: 'success',
                    title: 'Updated!',
                    text: 'Contact details updated successfully.',
                    confirmButtonColor: '#6C5CE7',
                    timer: 2000
                });
            }
        } else {
           
            const newContact = {
                id: 'contact_' + Date.now(),
                fullName,
                phoneNumber,
                emailAddress,
                address,
                group,
                notes,
                isFavorite,
                isEmergency,
                photo: currentPhotoBase64,
                createdAt: new Date().toISOString()
            };

            contacts.unshift(newContact);
            saveContactsToStorage();
            renderAll();
            contactModal.hide();
            Swal.fire({
                icon: 'success',
                title: 'Saved!',
                text: 'New contact added successfully.',
                confirmButtonColor: '#6C5CE7',
                timer: 2000
            });
        }
    }

    function openEditModal(id) {
        const contact = contacts.find(c => c.id === id);
        if (!contact) return;

        contactIdInput.value = contact.id;
        fullNameInput.value = contact.fullName;
        phoneNumberInput.value = contact.phoneNumber;
        emailAddressInput.value = contact.emailAddress || '';
        addressInput.value = contact.address || '';
        groupSelect.value = contact.group || '';
        notesInput.value = contact.notes || '';
        isFavoriteCheckbox.checked = contact.isFavorite;
        isEmergencyCheckbox.checked = contact.isEmergency;

        currentPhotoBase64 = contact.photo || '';
        renderAvatarPreview(currentPhotoBase64, getInitials(contact.fullName));

        modalTitle.textContent = 'Edit Contact';
        contactModal.show();
    }

    function confirmDeleteContact(id) {
        const contact = contacts.find(c => c.id === id);
        if (!contact) return;

        Swal.fire({
            title: 'Delete Contact?',
            text: `Are you sure you want to delete ${contact.fullName}? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#64748B',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            customClass: {
                popup: 'swal2-popup',
                title: 'swal2-title',
                confirmButton: 'swal2-styled swal2-confirm',
                cancelButton: 'swal2-styled swal2-cancel'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                contacts = contacts.filter(c => c.id !== id);
                saveContactsToStorage();
                renderAll();

                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Contact has been deleted.',
                    confirmButtonColor: '#6C5CE7',
                    timer: 2000
                });
            }
        });
    }

    function showValidationError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: message,
            confirmButtonColor: '#6C5CE7'
        });
    }

   
    function resetForm() {
        contactForm.reset();
        contactIdInput.value = '';
        currentPhotoBase64 = '';
        renderAvatarPreview('');
    }

    function renderAvatarPreview(photoBase64, initialsText = '') {
        if (photoBase64) {
            avatarPreview.innerHTML = `<img src="${photoBase64}" alt="Preview">`;
        } else if (initialsText) {
            avatarPreview.innerHTML = `<span style="font-size:24px;font-weight:700;">${initialsText}</span>`;
        } else {
            avatarPreview.innerHTML = `<i class="fa-solid fa-user default-avatar-icon"></i>`;
        }
    }

    function getInitials(name) {
        if (!name) return '??';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

});
