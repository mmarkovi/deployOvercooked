//const onnx = require('onnxjs');

//window.onnx = onnx;
async function test() {
    const onnx_session = new onnx.InferenceSession();
    await onnx_session.loadModel("./assets/source_agent/model.onnx")
    console.log(onnx_session);
    const input_data = [2, 2, -1, 0, 1, 0, 0, 0, 1, 1, 1, 3, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 4, 0, 0, 0, 0, 0, 6, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 1, 1, 1];
    const input = new onnx.Tensor(new Float32Array(43), 'float32', [43]);
    const outputMap = await onnx_session.run(input)
    console.log(outputMap)
}
test()

