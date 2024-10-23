document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        dropZone: document.getElementById('dropZone'),
        folderInput: document.getElementById('folderInput'),
        courseContent: document.getElementById('courseContent'),
        sectionList: document.getElementById('sectionList'),
        resources: document.getElementById('resources'),
        courseName: document.getElementById('courseName')
    };

    let courseData = null;

    const debug = {
        log(message, data = null) {
            console.log(`[Debug] ${message}`, data ? JSON.stringify(data, null, 2) : '');
        }
    };

    const fileUtils = {
        getType(filename) {
            const ext = filename.split('.').pop().toLowerCase();
            const typeMap = {
                'pdf': 'PDF',
                'doc': 'Word',
                'docx': 'Word',
                'ppt': 'PowerPoint',
                'pptx': 'PowerPoint',
                'xls': 'Excel',
                'xlsx': 'Excel',
                'txt': 'Text',
                'mp4': 'Video',
                'mp3': 'Audio',
                'jpg': 'Image',
                'jpeg': 'Image',
                'png': 'Image'
            };
            return typeMap[ext] || 'Other';
        },

        getIcon(type) {
            const iconMap = {
                'PDF': '📄',
                'Word': '📝',
                'PowerPoint': '📊',
                'Excel': '📈',
                'Text': '📃',
                'Video': '🎥',
                'Audio': '🎵',
                'Image': '🖼️',
                'Other': '📎'
            };
            return iconMap[type] || '📎';
        }
    };

    const ui = {
        showDropZone() {
            elements.dropZone.classList.remove('hidden');
            elements.courseContent.classList.add('hidden');
        },

        showCourseContent() {
            elements.dropZone.classList.add('hidden');
            elements.courseContent.classList.remove('hidden');
        },

        updateCourseName(name) {
            elements.courseName.textContent = name;
        },

        clearSections() {
            elements.sectionList.innerHTML = '';
            elements.resources.innerHTML = '';
        },

        displaySection(sectionName, resources) {
            elements.sectionList.querySelectorAll('li').forEach(li => {
                li.classList.remove('active');
                if (li.textContent === sectionName) {
                    li.classList.add('active');
                }
            });

            elements.resources.innerHTML = '';
            resources.forEach(resource => {
                const div = document.createElement('div');
                div.className = 'resource-item';
                div.innerHTML = `
                    <span class="file-icon">${fileUtils.getIcon(resource.type)}</span>
                    <span>${resource.name}</span>
                `;
                elements.resources.appendChild(div);
            });
        }
    };

    const courseManager = {
        initCourse(name) {
            return {
                name: name,
                sections: {}
            };
        },

        addSection(sectionName) {
            if (!courseData.sections[sectionName]) {
                courseData.sections[sectionName] = [];
                debug.log(`Added new section: ${sectionName}`);
            }
        },

        addResource(sectionName, resource) {
            if (courseData.sections[sectionName]) {
                courseData.sections[sectionName].push(resource);
                debug.log(`Added resource to ${sectionName}:`, resource);
            }
        },

        displayCourse() {
            debug.log('Final course data:', courseData);
            
            if (!courseData || !courseData.name) {
                debug.log('No valid course data found');
                ui.showDropZone();
                return;
            }

            const sectionCount = Object.keys(courseData.sections).length;
            debug.log(`Found ${sectionCount} sections`);

            if (sectionCount === 0) {
                debug.log('No sections found');
                ui.showDropZone();
                return;
            }

            ui.showCourseContent();
            ui.updateCourseName(courseData.name);
            ui.clearSections();

            Object.keys(courseData.sections).forEach((sectionName, index) => {
                const li = document.createElement('li');
                li.textContent = sectionName;
                li.addEventListener('click', () => {
                    ui.displaySection(sectionName, courseData.sections[sectionName]);
                });
                if (index === 0) {
                    li.classList.add('active');
                    ui.displaySection(sectionName, courseData.sections[sectionName]);
                }
                elements.sectionList.appendChild(li);
            });
        }
    };

    const fileProcessor = {
        async handleFileSelect(files) {
            try {
                debug.log(`Processing ${files.length} files`);
                courseData = courseManager.initCourse('');
                
                const fileArray = Array.from(files);
                
                // First pass: find course name and collect all subfolders
                for (const file of fileArray) {
                    const path = file.webkitRelativePath || file.name;
                    const pathParts = path.split('/');
                    
                    if (pathParts.length > 1) {
                        // Set course name if not already set
                        if (!courseData.name) {
                            courseData.name = pathParts[0];
                            debug.log('Found course name:', { name: courseData.name });
                        }

                        // Add subfolder as section
                        if (pathParts.length > 1) {
                            const sectionName = pathParts[1];
                            if (sectionName && sectionName !== '') {
                                courseManager.addSection(sectionName);
                            }
                        }
                    }
                }

                // Second pass: process files and add them to their sections
                for (const file of fileArray) {
                    const path = file.webkitRelativePath || file.name;
                    const pathParts = path.split('/');

                    // Only process files that are at least 3 levels deep (course/section/file)
                    if (pathParts.length > 2) {
                        const sectionName = pathParts[1];
                        const resource = {
                            name: pathParts[pathParts.length - 1],
                            path: path,
                            type: fileUtils.getType(pathParts[pathParts.length - 1])
                        };
                        courseManager.addResource(sectionName, resource);
                    }
                }

                debug.log('Finished processing files');
                courseManager.displayCourse();
            } catch (error) {
                console.error('Error processing files:', error);
                debug.log('Error:', { message: error.message, stack: error.stack });
                ui.showDropZone();
            }
        }
    };

    // Event Listeners
    elements.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.dropZone.classList.add('dragover');
    });

    elements.dropZone.addEventListener('dragleave', () => {
        elements.dropZone.classList.remove('dragover');
    });

    elements.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.dropZone.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        fileProcessor.handleFileSelect(files);
    });

    elements.folderInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        fileProcessor.handleFileSelect(files);
    });
});