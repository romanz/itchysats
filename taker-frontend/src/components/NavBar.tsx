import { MoonIcon, SunIcon, WarningIcon } from "@chakra-ui/icons";
import {
    Box,
    BoxProps,
    Button,
    CloseButton,
    Divider,
    Drawer,
    DrawerContent,
    Flex,
    FlexProps,
    HStack,
    Icon,
    IconButton,
    Image,
    Link,
    Select,
    Skeleton,
    Spacer,
    Text,
    Tooltip,
    useColorMode,
    useColorModeValue,
    useDisclosure,
} from "@chakra-ui/react";
import React, { ReactNode } from "react";
import { IconType } from "react-icons";
import { FaWallet } from "react-icons/fa";
import { FiHome, FiMenu } from "react-icons/fi";
import { Link as ReachLink, useNavigate, useParams } from "react-router-dom";
import { HEADER_HEIGHT, Symbol } from "../App";
import logoIcon from "../images/logo.svg";
import logoBlack from "../images/logo_nav_bar_black.svg";
import logoWhite from "../images/logo_nav_bar_white.svg";
import { ConnectionStatus } from "../types";
import DollarAmount from "./DollarAmount";

interface LinkItemProps {
    name: string;
    icon: IconType;
    target: string;
}
const LinkItems: Array<LinkItemProps> = [
    { name: "Home", icon: FiHome, target: "/" },
    { name: "Wallet", icon: FaWallet, target: "/wallet" },
];

interface NavBarProps {
    connectedToMaker: ConnectionStatus;
    nextFundingEvent: string | null;
    referencePrice: number | undefined;
    children: ReactNode;
}

export default function Nav({ connectedToMaker, nextFundingEvent, referencePrice, children }: NavBarProps) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    return (
        <Box minH="100vh" bg={useColorModeValue("gray.100", "gray.900")}>
            <SidebarContent
                onClose={() => onClose}
                display={{ base: "none", md: "block" }}
                zIndex={101}
                connectedToMaker={connectedToMaker}
            />
            <Drawer
                autoFocus={false}
                isOpen={isOpen}
                placement="left"
                onClose={onClose}
                returnFocusOnClose={false}
                onOverlayClick={onClose}
                size="full"
            >
                <DrawerContent>
                    <SidebarContent onClose={onClose} connectedToMaker={connectedToMaker} />
                </DrawerContent>
            </Drawer>
            <TopBar
                connectedToMaker={connectedToMaker}
                onOpen={onOpen}
                nextFundingEvent={nextFundingEvent}
                referencePrice={referencePrice}
            />
            <Box ml={{ base: 0, md: 60 }} p="4">
                {children}
            </Box>
        </Box>
    );
}

function TextDivider() {
    return <Divider orientation={"vertical"} borderColor={useColorModeValue("black", "white")} height={"20px"} />;
}

interface SidebarProps extends BoxProps {
    connectedToMaker: ConnectionStatus;
    onClose: () => void;
}

const LogoWithText = () => {
    const logo = useColorModeValue(
        <Image src={logoBlack} w="128px" />,
        <Image src={logoWhite} w="128px" />,
    );
    return <>{logo}</>;
};
const LogoWithoutText = () => {
    return <>{<Image src={logoIcon} w="32px" />}</>;
};

const SidebarContent = ({ connectedToMaker, onClose, ...rest }: SidebarProps) => {
    const navigate = useNavigate();
    const { symbol: symbolString } = useParams();
    let currentSymbol = symbolString ? Symbol[symbolString as keyof typeof Symbol] : Symbol.btcusd;

    const onSymbolChange = (symbol: string) => {
        onClose();
        navigate(`/trade/${symbol}/long`);
    };

    return (
        <Box
            transition="3s ease"
            bg={useColorModeValue("white", "gray.900")}
            borderRight="1px"
            borderRightColor={useColorModeValue("gray.200", "gray.700")}
            w={{ base: "full", md: 60 }}
            pos="fixed"
            h="full"
            {...rest}
        >
            <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
                <LogoWithText />
                <CloseButton display={{ base: "flex", md: "none" }} onClick={onClose} />
            </Flex>

            <Flex
                align="center"
                // p="4"
                // mx="4"
                mt={"4"}
                // mb={"4"}
                borderRadius="lg"
                role="group"
                w={"100%"}
            >
                <SymbolSelector current={currentSymbol} onChange={onSymbolChange} />
            </Flex>
            <Divider />

            {LinkItems.map((link) => (
                <NavItem key={link.name} icon={link.icon} target={link.target} onClick={onClose}>
                    {link.name}
                </NavItem>
            ))}
            <Divider />
            <Flex
                align="center"
                p="4"
                mx="4"
                borderRadius="lg"
                role="group"
            >
                <MakerOnlineStatus connectedToMaker={connectedToMaker} />
            </Flex>
        </Box>
    );
};

interface NavItemProps extends FlexProps {
    icon: IconType;
    target: string;
    onClick: () => void;
    children: ReactNode;
}
const NavItem = ({ icon, target, onClick, children, ...rest }: NavItemProps) => {
    return (
        <ReachLink to={target} style={{ textDecoration: "none" }} onClick={onClick}>
            <Flex
                focus={{ boxShadow: "none" }}
                align="center"
                p="4"
                mx="4"
                borderRadius="lg"
                role="group"
                cursor="pointer"
                _hover={{
                    bg: "orange.400",
                    color: "white",
                }}
                {...rest}
            >
                {icon && (
                    <Icon
                        mr="4"
                        fontSize="16"
                        _groupHover={{
                            color: "white",
                        }}
                        as={icon}
                    />
                )}
                {children}
            </Flex>
        </ReachLink>
    );
};

interface MakerOnlineStatusProps {
    connectedToMaker: ConnectionStatus;
}

const MakerOnlineStatus = ({ connectedToMaker }: MakerOnlineStatusProps) => {
    const connectionStatusDisplay = connectionStatus(connectedToMaker);
    const connectionStatusIconColor = useColorModeValue(
        connectionStatusDisplay.light,
        connectionStatusDisplay.dark,
    );

    return (
        <Tooltip label={connectionStatusDisplay.tooltip}>
            <HStack>
                {connectionStatusDisplay.warn
                    ? (
                        <WarningIcon
                            color={connectionStatusIconColor}
                            mr="1"
                        />
                    )
                    : (
                        <Icon
                            viewBox="0 0 200 200"
                            color={connectionStatusIconColor}
                            mr="2"
                        >
                            <path
                                fill="currentColor"
                                d="M 100, 100 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0"
                            />
                        </Icon>
                    )}
                <Text>{"Maker"}</Text>
            </HStack>
        </Tooltip>
    );
};

interface SymbolSelectorProps {
    current: Symbol;
    onChange: (val: string) => void;
}

const SymbolSelector = ({ current, onChange }: SymbolSelectorProps) => {
    let btcUsd = Symbol.btcusd;
    let ethUsd = Symbol.ethusd;

    return (
        <Select
            w={"100%"}
            placeholder="Select option"
            defaultValue={current}
            onChange={(value) => onChange(value.target.value)}
        >
            <option value={btcUsd}>BTCUSD</option>
            <option value={ethUsd}>ETHUSD</option>
        </Select>
    );
};

interface TopBarProps extends FlexProps {
    connectedToMaker: ConnectionStatus;
    nextFundingEvent: string | null;
    referencePrice: number | undefined;
    onOpen: () => void;
}

const TopBar = ({ connectedToMaker, nextFundingEvent, referencePrice, onOpen, ...rest }: TopBarProps) => {
    const { toggleColorMode } = useColorMode();

    const toggleIcon = useColorModeValue(
        <MoonIcon />,
        <SunIcon />,
    );

    return (
        <Box w="100%" position={"fixed"} height={`${HEADER_HEIGHT}px`} top="0" p={0} zIndex={102}>
            <Flex
                ml={{ base: 0, md: 60 }}
                px={{ base: 4, md: 4 }}
                alignItems="center"
                height={`${HEADER_HEIGHT}px`}
                bg={useColorModeValue("white", "gray.900")}
                borderBottomWidth="1px"
                borderBottomColor={useColorModeValue("gray.200", "gray.700")}
                justifyContent={{ base: "space-between", md: "flex-end" }}
                {...rest}
            >
                <IconButton
                    display={{ base: "flex", md: "none" }}
                    onClick={onOpen}
                    variant="outline"
                    aria-label="open menu"
                    icon={<FiMenu />}
                />

                <Spacer />
                <Box>
                    <HStack>
                        <Text fontSize={{ md: "sm", base: "xs" }}>{"Funding "}</Text>
                        <Skeleton
                            isLoaded={nextFundingEvent != null}
                            // height={"20px"}
                            display={"flex"}
                            alignItems={"center"}
                        >
                            <Tooltip
                                label={"The next time your CFDs will be extended and the funding fee will be collected based on the hourly rate."}
                                hasArrow
                            >
                                <HStack>
                                    <Text
                                        as={"b"}
                                        fontSize={{ md: "sm", base: "xs" }}
                                        textOverflow={"ellipsis"}
                                        overflow={"hidden"}
                                        whiteSpace={"nowrap"}
                                    >
                                        {nextFundingEvent}
                                    </Text>
                                </HStack>
                            </Tooltip>
                        </Skeleton>
                        <TextDivider />
                        <Text display={["inherit", "inherit", "none"]} fontSize={{ md: "sm", base: "xs" }}>
                            Index Price
                        </Text>
                        <Text display={["none", "none", "inherit"]} fontSize={{ md: "sm", base: "xs" }}>
                            Index Price
                        </Text>
                        <Skeleton
                            isLoaded={referencePrice !== undefined}
                            display={"flex"}
                            alignItems={"center"}
                        >
                            <Tooltip
                                label={"The price the Oracle attests to, the BitMEX BXBT index price"}
                                hasArrow
                            >
                                <Link href={"https://outcome.observer/h00.ooo/x/BitMEX/BXBT"} target={"_blank"}>
                                    <Text as={"b"} fontSize={{ md: "sm", base: "xs" }}>
                                        <DollarAmount amount={referencePrice || 0} />
                                    </Text>
                                </Link>
                            </Tooltip>
                        </Skeleton>
                    </HStack>
                </Box>
                <Spacer />

                <Box display={{ base: "flex", md: "none" }}>
                    <LogoWithoutText />
                </Box>

                <HStack spacing={{ base: "0", md: "0" }} display={{ base: "none", md: "flex" }}>
                    <Button onClick={toggleColorMode} variant={"unstyled"}>
                        {toggleIcon}
                    </Button>
                </HStack>
            </Flex>
        </Box>
    );
};

const connectionStatus = (connectedToMaker: ConnectionStatus) => {
    if (connectedToMaker.online) {
        return {
            warn: false,
            light: "green.600",
            dark: "green.400",
            tooltip: "The maker is online",
        };
    }

    return {
        warn: false,
        light: "red.600",
        dark: "red.400",
        tooltip: "The maker is offline",
    };
};
