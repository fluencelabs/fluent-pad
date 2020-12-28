// import fluence from 'fluence';

const useQuery: any = null;

/*

graphql

type Product {
    id: String!
    name: String!
    sku: String!
    description: String!
}

type Review {
    id: String!
    productId: String!
    author: String!
    text: String!
    appearsIn: [Product!]!
}

*/

/*
 
    adapter

    type(Product)
        .resolvedByService('products_service')
        .onNode('123')
        .hasMane(Review)
        .on('reviews')
            .equalTo('id');

    type(Review)
        .resolvedByService('reviews_service')
        .onNode('987');

*/

interface Product {
    id: string;
    name: string;
    sku: string;
    description: string;
    reviews: Review[];
}

interface Review {
    id: string;
    productId: string;
    author: string;
    text: string;
}

export const DemoComponent = () => {
    const { isLoading, error, data } = useQuery(`
        {
            Product {
                id,
                name,
                sku,
                description
                reviews: {
                    id,
                    author,
                    text
                }
            }
        }
    `);

    return <div>{isLoading && <div>.. render products here {data.products.length}</div>}</div>;
};
