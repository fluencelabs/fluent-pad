# What is fluent-pad

Fluent-pad is a collaborative code and text editor built with Fluence stack

## Usage

**TBD**

## How to run

To run app in the development mode use:

    npm start

To run tests in the interactive watch mode use:

    npm test

To make a production build use:

    npm run build

# Fluence stack

|         Layer         |                                                               Tech                                                                |              Scale               |               State               |                                                   Based on                                                    |
| :-------------------: | :-------------------------------------------------------------------------------------------------------------------------------: | :------------------------------: | :-------------------------------: | :-----------------------------------------------------------------------------------------------------------: |
|       Execution       |                                             [FCE](https://github.com/fluencelabs/fce)                                             |           Single peer            | Disk, network, external processes | Wasm, [IT](https://github.com/fluencelabs/interface-types), [Wasmer\*](https://github.com/fluencelabs/wasmer) |
|      Composition      |                                      [Aquamarine](https://github.com/fluencelabs/aquamarine)                                      |          Involved peers          |      Results and signatures       |                                                 ⇅, π-calculus                                                 |
|       Topology        | [TrustGraph](https://github.com/fluencelabs/fluence/tree/master/trust-graph), [DHT\*](https://github.com/fluencelabs/rust-libp2p) | Distributed with Kademlia\* algo |    Actual state of the network    |                                [libp2p](https://github.com/libp2p/rust-libp2p)                                |
| Security & Accounting |                                                            Blockchain                                                             |          Whole network           |        Licenses & payments        |                                                  substrate?                                                   |

<img alt="aquamarine scheme" align="center" src="doc/stack.png"/>
