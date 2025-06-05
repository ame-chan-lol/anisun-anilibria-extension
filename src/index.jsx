import {
    MediaPlayer,
    MediaPlayerInstance,
    MediaProvider,
    useMediaState,
    Menu,
} from '@vidstack/react';
import {
    DefaultAudioLayout,
    defaultLayoutIcons,
    DefaultVideoLayout,
} from '@vidstack/react/player/layouts/default';
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import { List, Pause, Play } from "lucide-react";
import "./vidstack-layout-video.css";
import "./vidstack-theme.css";
import "./globals.css";

function VidstackPlayer({
    title,
    pathname,
    videoSrc,
    searchParams,
}) {
    const reference = useRef(null);

    const currentTime = useMediaState('currentTime', reference);
    const duration = useMediaState('duration', reference);
    const error = useMediaState('error', reference);
    const controlsVisible = useMediaState('controlsVisible', reference);
    const isPlayingMediaState = useMediaState('playing', reference);
    const playerWidth = useMediaState('width', reference);

    const isTheLastTenSeconds = (duration - currentTime) <= 10;

    const [isSeeked, setIsSeeked] = useState();
    const [beforeSeekTime, setBeforeSeekTime] = useState(currentTime);

    const isPlayerCompact = playerWidth <= 676;
    // __local-control class changes the parent's node height to zero
    // so that user could seek the video using double taps/clicks
    // but:
    // 1. setting the parent's node height to zero breaks controls positions in the normal layout
    // 2. also in the normal layout we don't need the parent's node height value as zero for seeking
    const localControlsClassName = isPlayerCompact
        ? "__local-control"
        : "";
    const handleSeek = () => {
        if (!reference.current) {
            return;
        }

        setBeforeSeekTime(reference.current.currentTime);
    };
    const memoizedPlayer = useMemo(
        () => (
            <MediaPlayer
                onClick={handleSeek}
                onTouchStart={handleSeek}
                onSeeked={(time) => {
                    const difference = beforeSeekTime - time;

                    if (difference < 0) {
                        setIsSeeked("forward");

                        const timeout = setTimeout(() => {
                            setIsSeeked(undefined);
                        }, 400);

                        return () => clearTimeout(timeout);
                    }

                    if (difference > 0) {
                        setIsSeeked("backward");

                        const timeout = setTimeout(() => {
                            setIsSeeked(undefined);
                        }, 400);

                        return () => clearTimeout(timeout);
                    }
                }}
                playsInline={true}
                ref={reference}
                src={videoSrc}
                title={title}
                className="!rounded-none !overflow-clip !border-none"
                viewType="video"
                aspectRatio="16 / 9"
            >
                <MediaProvider />
                <DefaultAudioLayout icons={defaultLayoutIcons} />
                <DefaultVideoLayout
                    icons={defaultLayoutIcons}
                    slots={{
                        playButton: (
                            <button
                                className={`${localControlsClassName} flex justify-center items-center bg-transparent transition duration-200 ease-out hover:scale-110 hover:bg-[#fff3] hover:cursor-pointer active:scale-110 active:bg-[#fff3] mr-2`}
                                style={{
                                    borderRadius: isPlayerCompact ? "100%" : 8,
                                    width:        isPlayerCompact ? 96 : 40,
                                    height:       isPlayerCompact ? 96 : 40,
                                }}
                                onClick={async () => {
                                    if (!reference.current) {
                                        return;
                                    }

                                    if (reference.current.paused) {
                                        await reference.current.play();

                                        return;
                                    }

                                    await reference.current.pause();
                                }}
                                title={"Play video"}
                                aria-label={"Play video"}
                            >
                                {
                                    isPlayingMediaState ? (
                                        <Pause size={isPlayerCompact ? 40 : 24} />
                                    ) : (
                                        <Play size={isPlayerCompact ? 40 : 24} />
                                    )
                                }
                            </button>
                        ),
                    }}
                >
                    <div
                        className="pointer-events-none absolute flex aspect-square h-[200%] top-0 left-0 translate-x-[-85%] translate-y-[-25%] rounded-full transition duration-100"
                        style={{
                            background: isSeeked === "backward"
                                ? "#0005"
                                : "#0000",
                        }}
                    />
                    <div
                        className="pointer-events-none absolute flex aspect-square h-[200%] top-0 right-0 translate-x-[85%] translate-y-[-25%] rounded-full transition duration-100"
                        style={{
                            background: isSeeked === "forward"
                                ? "#0005"
                                : "#0000",
                        }}
                    />
                    <Menu.Root>
                        <Menu.Button
                            className={"absolute w-9 h-9 rounded-lg justify-center items-center z-10 bg-transparent transition duration-200 ease-out hover:scale-110 hover:bg-[#fff3] hover:cursor-pointer focus:scale-110 focus:bg-[#fff3]"}
                            style={
                                isPlayerCompact ? {
                                    display: controlsVisible ? "flex" : "none",
                                    top:     4,
                                    left:    4,
                                } : {
                                    display: controlsVisible ? "flex" : "none",
                                    bottom:  10,
                                    right:   96,
                                }
                            }
                        >
                            <List size={24} />
                        </Menu.Button>
                        <Menu.Items
                            className="vds-menu-items flex transition max-h-[400px] min-w-56 flex-col overflow-y-auto overscroll-y-contain rounded-lg border border-white/10 bg-black/95 p-2.5 font-sans text-[15px] font-medium outline-none"
                            placement={
                                isPlayerCompact ? "bottom start" : "top end"
                            }
                            style={{
                                margin: isPlayerCompact
                                    ? "0 4px 0 0"
                                    : "0 0 0 4px",
                            }}
                            offset={0}
                        >
                            {/* Menu Items + Submenus */}
                        </Menu.Items>
                    </Menu.Root>
                </DefaultVideoLayout>
            </MediaPlayer>
        ),
        [
            localControlsClassName,
            beforeSeekTime,
            isSeeked,
            isPlayingMediaState,
            isPlayerCompact,
            controlsVisible,
            videoSrc,
            searchParams,
        ],
    );

    // remove the link if it gives an error while loading
    useEffect(() => {
        if (error === null) {
            return;
        }

        if (location === undefined) {
            return;
        }

        const parameters = searchParams;

        if (!parameters.has("mediaSrc")) {
            return;
        }

        parameters.delete("mediaSrc");
        location.href = `${pathname}?${parameters.toString()}`;
    }, [error, pathname, searchParams]);

    //console.log(currentTime, error);

    return (
        <>
            {memoizedPlayer}
        </>
    );
}

const unableToFind = "Unable to find a player url";

function VideoClientQuery({
    idAnilibria,
    title,
    pathname,
    searchParams,
    queryKey,
}) {
    const status = searchParams.get("status") === "cached"
        ? "cached"
        : "uncached";
    const { isPending, error, data, failureCount } = useQuery({
        queryKey: [...queryKey, status],
        queryFn:  async () => {
            async function getCachedAnilibriaVideo() {
                let anime;

                try {
                    const response = await fetch(`/cached/anilibria.json`);
                    const body = await response.json();

                    anime = body.find((cachedAnime) => {
                        return cachedAnime.id === idAnilibria;
                    });
                } catch (error) {
                    return undefined;
                }

                const playerURL = anime?.player?.list?.["1"]?.hls?.fhd;

                if (!playerURL) {
                    return unableToFind;
                }

                return "https://cache.libria.fun" + playerURL;
            }

            async function fetchAnilibriaVideo() {
                let anime;

                try {
                    const response = await fetch(`https://api.anilibria.tv/v3/title?id=${idAnilibria}`);
                    anime = await response.json();
                } catch (error) {
                    return undefined;
                }

                const playerURL = anime?.player?.list?.["1"]?.hls?.fhd;

                if (!playerURL) {
                    return unableToFind;
                }

                return "https://cache.libria.fun" + playerURL;
            }

            if (status === "uncached") {
                const result = await fetchAnilibriaVideo();

                if (result === unableToFind) {
                    throw new Error(unableToFind);
                }

                return result;
            }

            const result = await getCachedAnilibriaVideo();

            if (result === unableToFind) {
                throw new Error(unableToFind);
            }

            return result;
        },
        retry: ((failureCount, error) => {
            if (error?.message === unableToFind) {
                return false;
            }

            return failureCount <= 3;
        }),
    });

    useEffect(() => {
        if (!window || !data) {
            return;
        }

        const parameters = searchParams;

        if (parameters.has("mediaSrc")) {
            return;
        }

        parameters.set("mediaSrc", data);
        // replace url without a website refresh
        window.history.replaceState({}, '', `${pathname}?${parameters.toString()}`);
    }, [data, searchParams, pathname]);

    if (isPending) {
        if (status === "cached") {
            return (
                <Skeleton
                    title="Loading."
                    description="Getting anime from the cache."
                >
                    <button
                        className="text-white bg-neutral-800 flex items-center gap-2 rounded-md p-2 cursor-pointer transition duration-200 disabled:opacity-60 disabled:cursor-default hover:brightness-105 dark:hover:brightness-125 focus:ring-2 ring-black dark:ring-white"
                        onClick={() => {
                            if (!location) {
                                return;
                            }

                            const parameters = searchParams;

                            parameters.set("status", "uncached");
                            location.href = `${pathname}?${parameters.toString()}`;
                        }}
                    >
                        Fetch uncached data
                    </button>
                </Skeleton>
            );
        }

        return (
            <>
                <Skeleton
                    title="Fetching."
                    description={`Fetching data from the Anilibria API. ${(failureCount !== undefined && failureCount >= 1) ? (
                        `Retry number ${failureCount}`
                    ) : ""}`}
                >
                    <button
                        className="text-white bg-neutral-800 flex items-center gap-2 rounded-md p-2 cursor-pointer transition duration-200 disabled:opacity-60 disabled:cursor-default hover:brightness-105 dark:hover:brightness-125 focus:ring-2 ring-black dark:ring-white"
                        onClick={() => {
                            if (!location) {
                                return;
                            }

                            const parameters = searchParams;

                            parameters.set("status", "cached");
                            location.href = `${pathname}?${parameters.toString()}`;
                        }}
                    >
                        Select cache
                    </button>
                </Skeleton>
            </>
        );
    }

    if (error) {
        if (error?.message === unableToFind) {
            return (
                <Skeleton
                    title="Error."
                    description="Unable to find any media files for this anime."
                />
            );
        }

        return (
            <Skeleton
                title="Loading."
                description="Getting anime from the cache."
            />
        );
    }

    return (
        <>
            <VidstackPlayer
                videoSrc={data}
                title={title}
                pathname={pathname}
                searchParams={searchParams}
            />
        </>
    );
}

const queryClient = new QueryClient();

function Skeleton({
    pulse = true,
    title,
    description,
    children,
}) {
    return (
        <div id="extensions-app-shell-id" className="bg-white dark:bg-black absolute top-0 right-0 left-0 bottom-0 z-10">
            <div className="flex w-full aspect-video bg-white dark:bg-black">
                <div
                    className={`flex flex-col gap-4 items-center justify-center h-full w-full bg-neutral-200 dark:bg-neutral-900 ${pulse ? "animate-pulse" : ""}`}
                >
                    <p className="leading-none text-xl sm:text-4xl font-semibold">
                        {title}
                    </p>
                    <p className="leading-none opacity-60 text-sm sm:text-lg">
                        {description}
                    </p>
                    {children}
                </div>
            </div>
        </div>
    );
}

function App() {
    const [searchParams, setSearchParams] = useState();
    const [pathname, setPathname] = useState();
    const [idMal, setIdMal] = useState();
    const [idAnilibria, setIdAnilibria] = useState();

    useEffect(() => {
        console.log("%cAnilibria player extension initialized", "background-color: #111;font-size: 28px;color:white;");

        if (location === undefined) {
            return;
        }

        setPathname(location.pathname);
        setSearchParams(new URLSearchParams(location.search));

        const pathnames = location.pathname.split("/");
        const animeId = pathnames[pathnames.length - 1];

        setIdMal(animeId);
    }, []);

    useEffect(() => {
        if (!idMal) {
            return;
        }

        (async () => {
            const response = await fetch("https://raw.githubusercontent.com/notwindstone/MALToAnything/refs/heads/main/anilibria/anilibria-mapped.json");
            const data = await response.json();

            for (const anime of data) {
                if (anime.idMal === Number(idMal)) {
                    setIdAnilibria(anime.idAnilibria);

                    return;
                }
            }

            setIdAnilibria("not found");

            return;
        })();
    }, [idMal]);

    if (!idMal) {
        return (
            <Skeleton
                title="Loading..."
                description="Getting current anime ID."
            />
        );
    }

    if (idAnilibria === "not found") {
        return (
            <div id="extensions-app-shell-id" className="bg-white dark:bg-black absolute top-0 right-0 left-0 bottom-0 z-10">
                <QueryClientProvider client={queryClient}>
                    <>no linked anime found</>
                    {/*
                    <AnilibriaSearchProvider searchName={title}>
                        <AnilibriaSearch />
                        <AnilibriaQuery />
                    </AnilibriaSearchProvider>
                    */}
                </QueryClientProvider>
            </div>
        );
    }

    if (!idAnilibria) {
        return (
            <Skeleton
                title="Mapping..."
                description="Getting anime id from a mapped database."
            />
        );
    }

    return (
        <div id="extensions-app-shell-id" className="bg-white dark:bg-black absolute top-0 right-0 left-0 bottom-0 z-10">
            <QueryClientProvider client={queryClient}>
                <AnilibriaVideo
                    searchParams={searchParams}
                    pathname={pathname}
                    idAnilibria={idAnilibria}
                    mediaSrc={searchParams.get("mediaSrc")}
                    title={searchParams.get("title")}
                />
            </QueryClientProvider>
        </div>
    );
}

function AnilibriaVideo({ searchParams, pathname, idAnilibria, mediaSrc, title }) {
    if (mediaSrc) {
        return (
            <>
                <VidstackPlayer
                    searchParams={searchParams}
                    pathname={pathname}
                    videoSrc={mediaSrc}
                    title={title}
                />
            </>
        );
    }

    return (
        <>
            <VideoClientQuery
                queryKey={["anime", "anilibria", idAnilibria.toString()]}
                searchParams={searchParams}
                pathname={pathname}
                title={title}
                idAnilibria={idAnilibria}
            />
        </>
    );
}

const relativeRoot = createRoot(document.getElementById("extensions-root-id"));

relativeRoot.render(<App />);
