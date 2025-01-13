import * as tf from '@tensorflow/tfjs';

const tftest1 = () => {
    const a = tf.tensor([1,2,3,4]);
    const b = a.sum(); // this is a 'chained' op.

    return b; // this will print the value of b to the console
}

const tftest2 = async () => {
    // Create a simple model.
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 1, inputShape: [1] }));

    // Prepare the model for training: Specify the loss and the optimizer.
    model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });

    // Generate some synthetic data for training. (y = 2x - 1)
    const xs = tf.tensor2d([-1, 0, 1, 2, 3, 4], [6, 1]);
    const ys = tf.tensor2d([-3, -1, 1, 3, 5, 7], [6, 1]);

    // Train the model using the data.
    await model.fit(xs, ys, { epochs: 250 });

    // Predict a value and return it as a string
    const prediction = model.predict(tf.tensor2d([20], [1, 1])).dataSync();
    return `Prediction for input 20: ${prediction[0]}`;
};

const tftest3 = async () => {
    const carsDataResponse = await fetch('https://storage.googleapis.com/tfjs-tutorials/carsData.json');
    const carsData = await carsDataResponse.json();

    // 0부터 5까지만 반환
    return carsData.slice(0, 5);
}

export { tftest1, tftest2, tftest3 };