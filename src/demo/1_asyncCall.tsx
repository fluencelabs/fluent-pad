// import fluence from 'fluence';

import { useEffect, useState } from 'react';

const fluence: any = {
    call: (script, args, timeout) => {
        // register particle id,
        // build particle
        // listen on "ack" service

        return new Promise((resolve, rejects) => {
            // if received "ack" "particle_id"
            // resolve with the result
            // if "particle_id" timed out reject
        });
    },
};

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

const getProductInfo = async (): Promise<Product[]> => {
    const timeout = 1000;
    const script = `
    (seq
        (call %init_peer_relay% ("op" "identity") [])
        (seq
            (call productsNode (productsService "get_products") [] products)
            (seq
                (call reviewsNode (reviewsService "get_reviews") [] reviews)
                (call %init_peer_id% ("ack" %particle_id%) [products reviews])
            )
        )
    )`;

    const params = {
        productsNode: '123', // probably discovered
        productsService: 'org.acme/products@v1', // probably discovered

        reviewsNode: '123', // probably discovered
        reviewsService: 'org.acme/revires@v1', // probably discovered
    };

    const [products, reviews] = await fluence.call(script, params, timeout);
    return products.join().with(reviews);
};

export const DemoComponent = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        setIsLoading(true);
        getProductInfo()
            .then((data) => {
                setProducts(data);
            })
            .catch((err) => {
                // catch timeout here
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    return <div>{isLoading && <div>.. render products here {products.length}</div>}</div>;
};
