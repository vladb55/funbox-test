const productItemClasses = {
    selected: 'selected',
    disabled: 'disabled',
    hoverSelected: 'hoverSelected'
}

const productItems = document.querySelectorAll('.js-product-preview-item');

const selectProduct = (item) => {
    item.addEventListener('click', () => {
        if (!item.classList.contains(productItemClasses.disabled)) {
            item.classList.toggle(productItemClasses.selected);
        }

        if (!isSelect()) {
            removeHover();
        }
    });

    let canAddHoverClass = false;
    item.addEventListener('mouseenter', () => {
        if (canAddHoverClass && isSelect()) {
            item.classList.add(productItemClasses.hoverSelected);
        }
    });

    item.addEventListener('mouseleave', () => {
        if (!canAddHoverClass && isSelect()) {
            canAddHoverClass = true;
        }

        if (canAddHoverClass) {
            removeHover();
        }
    });

    const isSelect = () => {
        return item.classList.contains(productItemClasses.selected);
    };

    const removeHover = () => {
        item.classList.remove(productItemClasses.hoverSelected);
    }
}

productItems.forEach(selectProduct);