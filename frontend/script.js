const API_URL = "http://127.0.0.1:5000/api/products";

let products = [];
let editingProductId = null;


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    // Navigation
    document.querySelectorAll(".nav-item[data-page]").forEach(button => {
        button.addEventListener("click", () => {
            showPage(button.dataset.page);
        });
    });

    document.querySelectorAll("[data-page-link]").forEach(button => {
        button.addEventListener("click", () => {
            showPage(button.dataset.pageLink);
        });
    });


    // Buttons
    document.getElementById("topAddProduct")
        ?.addEventListener("click", openAddProduct);

    document.getElementById("productsAddButton")
        ?.addEventListener("click", openAddProduct);

    document.getElementById("refreshButton")
        ?.addEventListener("click", loadProducts);


    // Search
    document.getElementById("searchInput")
        ?.addEventListener("input", filterProducts);


    // Modal
    document.getElementById("closeModal")
        ?.addEventListener("click", closeModal);

    document.getElementById("cancelModal")
        ?.addEventListener("click", closeModal);

    document.getElementById("productModal")
        ?.addEventListener("click", event => {

            if (event.target.id === "productModal") {
                closeModal();
            }

        });


    // Form
    document.getElementById("productForm")
        ?.addEventListener("submit", saveProduct);


    // Date
    const dateElement = document.getElementById("currentDate");

    if (dateElement) {

        dateElement.textContent =
            new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric"
            });

    }


    // Load data
    loadProducts();

});


// ============================================================
// PAGE NAVIGATION
// ============================================================

function showPage(page) {

    const pageMap = {

        dashboard: "dashboardPage",

        products: "productsPage",

        "low-stock": "low-stockPage"

    };


    document.querySelectorAll(".page").forEach(section => {

        section.classList.remove("active-page");

    });


    const selectedPage =
        document.getElementById(
            pageMap[page] || "dashboardPage"
        );


    if (selectedPage) {

        selectedPage.classList.add("active-page");

    }


    // Sidebar active item

    document.querySelectorAll(".nav-item").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.page === page
        );

    });


    // Page title

    const titles = {

        dashboard: "Dashboard",

        products: "Products",

        "low-stock": "Low Stock"

    };


    const pageTitle =
        document.getElementById("pageTitle");


    if (pageTitle) {

        pageTitle.textContent =
            titles[page] || "Dashboard";

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ============================================================
// LOAD PRODUCTS
// ============================================================

async function loadProducts() {

    try {

        setConnectionStatus(true);


        const response = await fetch(API_URL, {

            method: "GET",

            headers: {
                "Accept": "application/json"
            }

        });


        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }


        const data = await response.json();


        if (Array.isArray(data)) {

            products = data;

        }

        else if (Array.isArray(data.products)) {

            products = data.products;

        }

        else {

            products = [];

        }


        updateDashboard();

        renderDashboardProducts();

        renderProducts(products);

        renderLowStock();


    }

    catch (error) {

        console.error(
            "Backend connection error:",
            error
        );


        setConnectionStatus(false);


        const table =
            document.getElementById(
                "productTableBody"
            );


        if (table) {

            table.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        class="error-message"
                    >

                        Unable to connect to backend.

                        <br>

                        Make sure Flask is running
                        on port 5000.

                    </td>

                </tr>

            `;

        }

    }

}


// ============================================================
// DASHBOARD STATISTICS
// ============================================================

function updateDashboard() {

    const totalProducts =
        products.length;


    const totalStock =
        products.reduce(
            (total, product) => {

                return total +
                    Number(product.quantity || 0);

            },
            0
        );


    const lowStock =
        products.filter(product => {

            return Number(
                product.quantity || 0
            ) <= 10;

        }).length;


    const inventoryValue =
        products.reduce(
            (total, product) => {

                return total +
                    Number(product.quantity || 0) *
                    Number(product.price || 0);

            },
            0
        );


    setText(
        "totalProducts",
        totalProducts
    );


    setText(
        "totalStock",
        totalStock
    );


    setText(
        "lowStock",
        lowStock
    );


    setText(
        "sidebarLowStock",
        lowStock
    );


    setText(
        "inventoryValue",
        formatCurrency(inventoryValue)
    );

}


// ============================================================
// DASHBOARD PRODUCTS
// ============================================================

function renderDashboardProducts() {

    const table =
        document.getElementById(
            "dashboardProducts"
        );


    if (!table) return;


    const recentProducts =
        products.slice(0, 5);


    if (recentProducts.length === 0) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty-message"
                >

                    No products available yet.

                </td>

            </tr>

        `;

        return;

    }


    table.innerHTML =
        recentProducts.map(product => {

            return `

                <tr>

                    <td>

                        <strong>
                            ${escapeHTML(
                                product.product_id
                            )}
                        </strong>

                    </td>


                    <td>
                        ${escapeHTML(product.name)}
                    </td>


                    <td>
                        ${escapeHTML(product.category)}
                    </td>


                    <td>
                        ${Number(
                            product.quantity || 0
                        )}
                    </td>


                    <td>
                        ${formatCurrency(
                            product.price
                        )}
                    </td>


                    <td>
                        ${getStatusBadge(
                            product.quantity
                        )}
                    </td>

                </tr>

            `;

        }).join("");

}


// ============================================================
// PRODUCTS TABLE
// ============================================================

function renderProducts(productList) {

    const table =
        document.getElementById(
            "productTableBody"
        );


    if (!table) return;


    if (productList.length === 0) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty-message"
                >

                    No products found.

                </td>

            </tr>

        `;

        return;

    }


    table.innerHTML =
        productList.map(product => {

            return `

                <tr>

                    <td>

                        <strong>
                            ${escapeHTML(
                                product.product_id
                            )}
                        </strong>

                    </td>


                    <td>
                        ${escapeHTML(product.name)}
                    </td>


                    <td>
                        ${escapeHTML(product.category)}
                    </td>


                    <td>
                        ${Number(
                            product.quantity || 0
                        )}
                    </td>


                    <td>
                        ${formatCurrency(
                            product.price
                        )}
                    </td>


                    <td>
                        ${getStatusBadge(
                            product.quantity
                        )}
                    </td>


                    <td>

                        <div class="action-group">

                            <button
                                class="action-btn edit-btn"
                                data-edit="${escapeHTML(
                                    product.product_id
                                )}"
                            >

                                Edit

                            </button>


                            <button
                                class="action-btn delete-btn"
                                data-delete="${escapeHTML(
                                    product.product_id
                                )}"
                            >

                                Delete

                            </button>

                        </div>

                    </td>

                </tr>

            `;

        }).join("");


    // Edit buttons

    table
        .querySelectorAll("[data-edit]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openEditProduct(
                        button.dataset.edit
                    );

                }
            );

        });


    // Delete buttons

    table
        .querySelectorAll("[data-delete]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteProduct(
                        button.dataset.delete
                    );

                }
            );

        });

}


// ============================================================
// SEARCH
// ============================================================

function filterProducts() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );


    if (!searchInput) return;


    const query =
        searchInput.value
            .trim()
            .toLowerCase();


    if (!query) {

        renderProducts(products);

        return;

    }


    const filteredProducts =
        products.filter(product => {

            return (

                String(product.product_id)
                    .toLowerCase()
                    .includes(query)

                ||

                String(product.name)
                    .toLowerCase()
                    .includes(query)

                ||

                String(product.category)
                    .toLowerCase()
                    .includes(query)

            );

        });


    renderProducts(filteredProducts);

}


// ============================================================
// LOW STOCK
// ============================================================

function renderLowStock() {

    const lowStockProducts =
        products.filter(product => {

            return Number(
                product.quantity || 0
            ) <= 10;

        });


    const dashboardContainer =
        document.getElementById(
            "dashboardLowStock"
        );


    const pageContainer =
        document.getElementById(
            "lowStockPageList"
        );


    // Dashboard

    if (dashboardContainer) {

        if (lowStockProducts.length === 0) {

            dashboardContainer.innerHTML = `

                <div class="empty-alert">

                    <strong>
                        Inventory looks healthy
                    </strong>

                    <span>
                        No products currently need
                        restocking.
                    </span>

                </div>

            `;

        }

        else {

            dashboardContainer.innerHTML =
                lowStockProducts
                    .slice(0, 4)
                    .map(product => {

                        return `

                            <div
                                class="low-stock-item
                                ${
                                    Number(
                                        product.quantity
                                    ) === 0
                                        ? "out"
                                        : ""
                                }"
                            >

                                <div>

                                    <h3>
                                        ${escapeHTML(
                                            product.name
                                        )}
                                    </h3>

                                    <p>

                                        ${escapeHTML(
                                            product.product_id
                                        )}

                                        ·

                                        ${Number(
                                            product.quantity || 0
                                        )}

                                        units remaining

                                    </p>

                                </div>


                                ${getStatusBadge(
                                    product.quantity
                                )}

                            </div>

                        `;

                    })
                    .join("");

        }

    }


    // Low stock page

    if (pageContainer) {

        if (lowStockProducts.length === 0) {

            pageContainer.innerHTML = `

                <div class="empty-alert">

                    <strong>
                        All products are sufficiently stocked
                    </strong>

                    <span>
                        No low-stock items to review.
                    </span>

                </div>

            `;

        }

        else {

            pageContainer.innerHTML =
                lowStockProducts
                    .map(product => {

                        return `

                            <div
                                class="stock-alert-card
                                ${
                                    Number(
                                        product.quantity
                                    ) === 0
                                        ? "out"
                                        : ""
                                }"
                            >

                                <div
                                    class="stock-alert-icon"
                                >

                                    !

                                </div>


                                <div
                                    class="stock-alert-content"
                                >

                                    <span
                                        class="alert-label"
                                    >

                                        ${
                                            Number(
                                                product.quantity
                                            ) === 0
                                                ? "OUT OF STOCK"
                                                : "LOW STOCK"
                                        }

                                    </span>


                                    <h3>

                                        ${escapeHTML(
                                            product.name
                                        )}

                                    </h3>


                                    <p>

                                        Product ID:

                                        <strong>
                                            ${escapeHTML(
                                                product.product_id
                                            )}
                                        </strong>

                                    </p>


                                    <p>

                                        Remaining:

                                        <strong>
                                            ${Number(
                                                product.quantity || 0
                                            )}

                                            units
                                        </strong>

                                    </p>

                                </div>


                                <button
                                    class="action-btn edit-btn"
                                    data-low-edit="${escapeHTML(
                                        product.product_id
                                    )}"
                                >

                                    Update

                                </button>

                            </div>

                        `;

                    })
                    .join("");


            pageContainer
                .querySelectorAll(
                    "[data-low-edit]"
                )
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        () => {

                            openEditProduct(
                                button.dataset.lowEdit
                            );

                        }
                    );

                });

        }

    }

}


// ============================================================
// ADD PRODUCT MODAL
// ============================================================

function openAddProduct() {

    editingProductId = null;


    const form =
        document.getElementById(
            "productForm"
        );


    if (form) {

        form.reset();

    }


    document.getElementById(
        "modalTitle"
    ).textContent = "Add Product";


    document.getElementById(
        "productId"
    ).disabled = false;


    document.getElementById(
        "productModal"
    ).classList.add("show");


    setTimeout(() => {

        document
            .getElementById("productId")
            ?.focus();

    }, 100);

}


// ============================================================
// EDIT PRODUCT MODAL
// ============================================================

function openEditProduct(productId) {

    const product =
        products.find(product => {

            return String(
                product.product_id
            ) === String(productId);

        });


    if (!product) {

        showNotification(
            "Product not found.",
            "error"
        );

        return;

    }


    editingProductId =
        product.product_id;


    document.getElementById(
        "modalTitle"
    ).textContent = "Edit Product";


    document.getElementById(
        "productId"
    ).value = product.product_id;


    document.getElementById(
        "productName"
    ).value = product.name;


    document.getElementById(
        "productCategory"
    ).value = product.category;


    document.getElementById(
        "productQuantity"
    ).value = product.quantity;


    document.getElementById(
        "productPrice"
    ).value = product.price;


    document.getElementById(
        "productId"
    ).disabled = true;


    document.getElementById(
        "productModal"
    ).classList.add("show");

}


// ============================================================
// CLOSE MODAL
// ============================================================

function closeModal() {

    document
        .getElementById("productModal")
        ?.classList.remove("show");


    document
        .getElementById("productForm")
        ?.reset();


    const idInput =
        document.getElementById(
            "productId"
        );


    if (idInput) {

        idInput.disabled = false;

    }


    editingProductId = null;

}


// ============================================================
// SAVE PRODUCT
// ============================================================

async function saveProduct(event) {

    event.preventDefault();


    const productId =
        document.getElementById(
            "productId"
        ).value.trim();


    const name =
        document.getElementById(
            "productName"
        ).value.trim();


    const category =
        document.getElementById(
            "productCategory"
        ).value.trim();


    const quantity =
        Number(
            document.getElementById(
                "productQuantity"
            ).value
        );


    const price =
        Number(
            document.getElementById(
                "productPrice"
            ).value
        );


    // Validation

    if (
        !productId ||
        !name ||
        !category
    ) {

        showNotification(
            "Please complete all required fields.",
            "error"
        );

        return;

    }


    if (
        !Number.isInteger(quantity) ||
        quantity < 0
    ) {

        showNotification(
            "Quantity must be a valid non-negative integer.",
            "error"
        );

        return;

    }


    if (
        !Number.isFinite(price) ||
        price < 0
    ) {

        showNotification(
            "Price must be a valid non-negative number.",
            "error"
        );

        return;

    }


    try {

        let response;


        // UPDATE

        if (editingProductId) {

            response =
                await fetch(
                    `${API_URL}/${encodeURIComponent(
                        editingProductId
                    )}`,
                    {

                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            name,

                            category,

                            quantity,

                            price

                        })

                    }
                );

        }

        // ADD

        else {

            response =
                await fetch(
                    API_URL,
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            product_id:
                                productId,

                            name,

                            category,

                            quantity,

                            price

                        })

                    }
                );

        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "Unable to save product."
            );

        }


        const wasEditing =
            Boolean(editingProductId);


        closeModal();


        await loadProducts();


        showNotification(

            wasEditing
                ? "Product updated successfully."
                : "Product added successfully.",

            "success"

        );

    }

    catch (error) {

        console.error(error);


        showNotification(
            error.message ||
            "Server connection failed.",
            "error"
        );

    }

}


// ============================================================
// DELETE PRODUCT
// ============================================================

async function deleteProduct(productId) {

    const product =
        products.find(product => {

            return String(
                product.product_id
            ) === String(productId);

        });


    const productName =
        product?.name || productId;


    const confirmed =
        confirm(
            `Delete "${productName}" from inventory?`
        );


    if (!confirmed) return;


    try {

        const response =
            await fetch(
                `${API_URL}/${encodeURIComponent(
                    productId
                )}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "Unable to delete product."
            );

        }


        await loadProducts();


        showNotification(
            "Product deleted successfully.",
            "success"
        );

    }

    catch (error) {

        console.error(error);


        showNotification(
            error.message ||
            "Delete operation failed.",
            "error"
        );

    }

}


// ============================================================
// STATUS BADGE
// ============================================================

function getStatusBadge(quantity) {

    const value =
        Number(quantity || 0);


    if (value === 0) {

        return `
            <span class="status status-out">
                Out of Stock
            </span>
        `;

    }


    if (value <= 10) {

        return `
            <span class="status status-low">
                Low Stock
            </span>
        `;

    }


    return `
        <span class="status status-good">
            In Stock
        </span>
    `;

}


// ============================================================
// BACKEND STATUS
// ============================================================

function setConnectionStatus(connected) {

    document
        .querySelectorAll(".connection")
        .forEach(element => {

            element.classList.toggle(
                "offline",
                !connected
            );


            const dot =
                element.querySelector(
                    ".status-dot"
                );


            if (dot) {

                dot.classList.toggle(
                    "offline",
                    !connected
                );

            }

        });


    document
        .querySelectorAll(
            ".system-status small"
        )
        .forEach(element => {

            element.textContent =
                connected
                    ? "API Connected"
                    : "API Offline";

        });

}


// ============================================================
// NOTIFICATION
// ============================================================

function showNotification(
    message,
    type = "success"
) {

    const notification =
        document.getElementById(
            "notification"
        );


    if (!notification) return;


    notification.textContent =
        message;


    notification.className =
        `notification ${type} show`;


    clearTimeout(
        window.notificationTimer
    );


    window.notificationTimer =
        setTimeout(() => {

            notification.classList.remove(
                "show"
            );

        }, 3200);

}


// ============================================================
// HELPERS
// ============================================================

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


function formatCurrency(value) {

    return "₹" +
        Number(value || 0)
            .toLocaleString(
                "en-IN",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );

}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}