# Shammy's Clothing — Homepage Demo

A dependency-free static e-commerce homepage, styled after the
[Atticus Finch Clothing](https://atticusfinchclothing.com.au/) baseline: clean,
minimal, Melbourne fashion.

Product data lives in `data/products.json` — the pages fetch it at runtime to
render the "Best Sellers" grid, the product-type pages and the product
detail page. When moving to a database, point the same endpoint at the database
and keep the JSON shape.

## Pages

- `index.html` — homepage with the best sellers, category tiles and the knitwear edit
- `clothing.html` — clothing product-type page
- `footwear.html` — footwear product-type page
- `accessories.html` — accessories product-type page
- `product-detail.html?id=<id>` — product detail page with image, price, size picker, add-to-basket, and related products
- `about.html` — about page with brand story and values
- `contact.html` — contact page with contact form and store details

## To view locally

Serve the folder from this directory:

```
python3 -m http.server
```

then open http://localhost:8000/

- `index.html` — the homepage
- `css/style.css` — all styles
- `js/main.js` — mobile nav, scroll reveal, demo cart counter, product grid & detail rendering from `data/products.json`
- `data/products.json` — product data (`id`, `name`, `price`, `category`, `imageClass`, `imageSrc`, `sku`, `description`, plus optional `bestSeller`, `bestSellerRank` and `unitsSold` metadata used to build the homepage best sellers grid)
