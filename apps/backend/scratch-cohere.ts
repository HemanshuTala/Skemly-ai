import { CohereClient } from 'cohere-ai';

const run = async () => {
    try {
        const cohere = new CohereClient({
            token: 'qazXPKGJagliY9KwWCOyJ1IucCr92vh4LJO9wsfD',
        });
        const res = await cohere.chat({
            model: 'command-r-08-2024',
            message: 'Hello'
        });
        console.log("SUCCESS", res.text);
    } catch (e: any) {
        console.error("ERROR BODY", e);
    }
}
run();
