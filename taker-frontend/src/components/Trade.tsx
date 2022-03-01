import { ExternalLinkIcon } from "@chakra-ui/icons";
import { BoxProps } from "@chakra-ui/layout";
import {
    Box,
    Button,
    ButtonGroup,
    Center,
    Circle,
    FormControl,
    FormHelperText,
    FormLabel,
    Grid,
    GridItem,
    HStack,
    IconButton,
    InputGroup,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Skeleton,
    Slider,
    SliderFilledTrack,
    SliderThumb,
    SliderTrack,
    Table,
    Tbody,
    Td,
    Text,
    Tr,
    useColorModeValue,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CfdOrderRequestPayload, ConnectionStatus } from "../types";
import usePostRequest from "../usePostRequest";
import AlertBox from "./AlertBox";
import BitcoinAmount from "./BitcoinAmount";
import ConfirmOrderModal from "./ConfirmOrderModal";
import DollarAmount from "./DollarAmount";

const MotionBox = motion<BoxProps>(Box);

interface TradeProps {
    connectedToMaker: ConnectionStatus;
    orderId?: string;
    minQuantity: number;
    maxQuantity: number;
    referencePrice?: number;
    askPrice?: number;
    parcelSize: number;
    marginPerParcel: number;
    leverage: number;
    liquidationPrice?: number;
    walletBalance: number;
    openingFee: number;
    fundingRateAnnualized: string;
    fundingRateHourly: string;
    fundingFeePerParcel: number;
}

export default function Trade({
    connectedToMaker,
    minQuantity,
    maxQuantity,
    askPrice: askPriceAsNumber,
    parcelSize,
    marginPerParcel,
    leverage,
    liquidationPrice: liquidationPriceAsNumber,
    orderId,
    walletBalance,
    openingFee,
    fundingRateAnnualized,
    fundingRateHourly,
    fundingFeePerParcel,
}: TradeProps) {
    let [quantity, setQuantity] = useState(0);
    let [userHasEdited, setUserHasEdited] = useState(false);

    // We update the quantity because the offer can change any time.
    useEffect(() => {
        if (!userHasEdited) {
            setQuantity(minQuantity);
        }
    }, [userHasEdited, minQuantity, setQuantity]);

    let [onSubmit, isSubmitting] = usePostRequest<CfdOrderRequestPayload>("/api/cfd/order");

    let outerCircleBg = useColorModeValue("gray.100", "gray.700");
    let innerCircleBg = useColorModeValue("gray.200", "gray.600");

    const { isOpen: isLongOpen, onOpen: onLongOpen, onClose: onLongClose } = useDisclosure();
    const { isOpen: isShortOpen, onOpen: onShortOpen, onClose: onShortClose } = useDisclosure();

    const margin = (quantity / parcelSize) * marginPerParcel;

    const feeForFirstSettlementInterval = (quantity / parcelSize) * fundingFeePerParcel;

    const balanceTooLow = walletBalance < margin;
    const quantityTooHigh = maxQuantity < quantity;
    const quantityTooLow = minQuantity > quantity;
    const quantityGreaterZero = quantity > 0;
    const quantityIsEvenlyDivisibleByIncrement = isEvenlyDivisible(quantity, parcelSize);

    const canSubmit = orderId && !isSubmitting && !balanceTooLow
        && !quantityTooHigh && !quantityTooLow && quantityGreaterZero && quantityIsEvenlyDivisibleByIncrement;

    let alertBox;

    if (!connectedToMaker.online) {
        alertBox = <AlertBox
            title={"No maker!"}
            description={"You are not connected to any maker. Functionality may be limited"}
        />;
    } else {
        if (balanceTooLow) {
            alertBox = <AlertBox
                title={"Your balance is too low!"}
                description={"Please deposit more into your wallet."}
            />;
        }
        if (!quantityIsEvenlyDivisibleByIncrement) {
            alertBox = <AlertBox
                title={`Quantity is not in increments of ${parcelSize}!`}
                description={`Increment is ${parcelSize}`}
            />;
        }
        if (quantityTooHigh) {
            alertBox = <AlertBox
                title={"Quantity too high!"}
                description={`Max available liquidity is ${maxQuantity}`}
            />;
        }
        if (quantityTooLow || !quantityGreaterZero) {
            alertBox = <AlertBox title={"Quantity too low!"} description={`Min quantity is ${minQuantity}`} />;
        }
        if (!orderId) {
            alertBox = <AlertBox
                title={"No liquidity in maker!"}
                description={"The maker you are connected has no active offers"}
            />;
        }
    }

    const confirmRef = useRef<HTMLButtonElement | null>(null);

    return (
        <VStack>
            ?<Center>
                <Grid
                    templateRows="repeat(1, 1fr)"
                    templateColumns="repeat(1, 1fr)"
                    gap={4}
                    maxWidth={"500px"}
                >
                    <GridItem colSpan={1}>
                        <Center>
                            <MotionBox
                                variants={{
                                    pulse: {
                                        scale: [1, 1.05, 1],
                                    },
                                }}
                                // @ts-ignore: lint is complaining but should be fine :)
                                transition={{
                                    // type: "spring",
                                    ease: "linear",
                                    duration: 2,
                                    repeat: Infinity,
                                }}
                                animate={"pulse"}
                            >
                                <Circle size="256px" bg={outerCircleBg}>
                                    <Circle size="180px" bg={innerCircleBg}>
                                        <MotionBox>
                                            <Skeleton isLoaded={!!askPriceAsNumber && askPriceAsNumber > 0}>
                                                <Text fontSize={"4xl"} as="b">
                                                    <DollarAmount amount={askPriceAsNumber || 0} />
                                                </Text>
                                            </Skeleton>
                                        </MotionBox>
                                    </Circle>
                                </Circle>
                            </MotionBox>
                        </Center>
                    </GridItem>
                    <GridItem colSpan={1} paddingLeft={5} paddingRight={5}>
                        <Quantity
                            min={minQuantity}
                            max={maxQuantity}
                            quantity={quantity}
                            onChange={(_valueAsString: string, valueAsNumber: number) => {
                                setQuantity(Number.isNaN(valueAsNumber) ? 0 : valueAsNumber);
                                setUserHasEdited(true);
                            }}
                            parcelSize={parcelSize}
                        />
                    </GridItem>
                    <GridItem colSpan={1} paddingLeft={5} paddingRight={5}>
                        <Leverage leverage={leverage} />
                    </GridItem>
                    <GridItem colSpan={1}>
                        <OpeningDetails
                            margin={margin}
                            walletBalance={walletBalance}
                        />
                    </GridItem>
                    <GridItem colSpan={1}>
                        <Center>
                            <ButtonGroup
                                variant="solid"
                                padding="3"
                                spacing="6"
                            >
                                <Button
                                    disabled={!canSubmit}
                                    colorScheme="red"
                                    size="lg"
                                    onClick={onShortOpen}
                                    h={16}
                                    w={"40"}
                                    fontSize={"xl"}
                                >
                                    Short
                                </Button>
                                <Button
                                    disabled={!canSubmit}
                                    colorScheme="green"
                                    size="lg"
                                    onClick={onLongOpen}
                                    h={16}
                                    w={"40"}
                                    fontSize={"xl"}
                                >
                                    Long
                                </Button>
                                <ConfirmOrderModal
                                    orderId={orderId!}
                                    position="long"
                                    isOpen={isLongOpen}
                                    onClose={() => {
                                        setQuantity(minQuantity);
                                        setUserHasEdited(false);

                                        onLongClose();
                                    }}
                                    isSubmitting={isSubmitting}
                                    onSubmit={onSubmit}
                                    confirmRef={confirmRef}
                                    quantity={quantity}
                                    askPriceAsNumber={askPriceAsNumber}
                                    margin={margin}
                                    leverage={leverage}
                                    liquidationPriceAsNumber={liquidationPriceAsNumber}
                                    feeForFirstSettlementInterval={feeForFirstSettlementInterval}
                                    fundingRateHourly={fundingRateHourly}
                                    fundingRateAnnualized={fundingRateAnnualized}
                                />
                                <ConfirmOrderModal
                                    orderId={orderId!}
                                    position="short"
                                    isOpen={isShortOpen}
                                    onClose={() => {
                                        setQuantity(minQuantity);
                                        setUserHasEdited(false);
                                        onShortClose();
                                    }}
                                    isSubmitting={isSubmitting}
                                    onSubmit={onSubmit}
                                    confirmRef={confirmRef}
                                    quantity={quantity}
                                    askPriceAsNumber={askPriceAsNumber}
                                    margin={margin}
                                    leverage={leverage}
                                    liquidationPriceAsNumber={liquidationPriceAsNumber}
                                    feeForFirstSettlementInterval={feeForFirstSettlementInterval}
                                    fundingRateHourly={fundingRateHourly}
                                    fundingRateAnnualized={fundingRateAnnualized}
                                />
                            </ButtonGroup>
                        </Center>
                    </GridItem>
                </Grid>
            </Center>
            {alertBox}
        </VStack>
    );
}

interface QuantityProps {
    min: number;
    max: number;
    quantity: number;
    parcelSize: number;
    onChange: (valueAsString: string, valueAsNumber: number) => void;
}

function Quantity({ min, max, onChange, quantity, parcelSize }: QuantityProps) {
    return (
        <FormControl id="quantity">
            <Center>
                <FormLabel>BTC/USD Contracts</FormLabel>
            </Center>
            <InputGroup>
                <NumberInput
                    min={min}
                    max={max}
                    defaultValue={min}
                    step={parcelSize}
                    onChange={onChange}
                    value={quantity}
                    w={"100%"}
                >
                    <NumberInputField />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
            </InputGroup>
            <FormHelperText>How much do you want to buy or sell?</FormHelperText>
        </FormControl>
    );
}

interface LeverageProps {
    leverage: number;
}

function Leverage({ leverage }: LeverageProps) {
    return (
        <FormControl id="leverage">
            <Center>
                <FormLabel>Leverage</FormLabel>
            </Center>
            <Slider isDisabled={true} value={leverage} min={1} max={5} step={1}>
                <SliderTrack>
                    <Box position="relative" right={10} />
                    <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb boxSize={6}>
                    <Text color="black">{leverage}</Text>
                </SliderThumb>
            </Slider>
            <FormHelperText>
                How much do you want to leverage your position?
            </FormHelperText>
        </FormControl>
    );
}

interface OpeningDetailsProps {
    margin: number;
    walletBalance: number;
}

function OpeningDetails({ margin, walletBalance }: OpeningDetailsProps) {
    const navigate = useNavigate();
    return (
        <Table variant="simple">
            <Tbody>
                <Tr>
                    <Td>Required Margin</Td>
                    <Td isNumeric><BitcoinAmount btc={margin} /></Td>
                </Tr>
                <Tr>
                    <Td>
                        <HStack>
                            <Text>Available Balance</Text>
                            <IconButton
                                variant={"unstyled"}
                                aria-label="Go to wallet"
                                icon={<ExternalLinkIcon />}
                                onClick={() => navigate("/wallet")}
                            />
                        </HStack>
                    </Td>
                    <Td isNumeric>
                        <BitcoinAmount btc={walletBalance} />
                    </Td>
                </Tr>
            </Tbody>
        </Table>
    );
}

export function isEvenlyDivisible(numerator: number, divisor: number): boolean {
    return (numerator % divisor === 0.0);
}
