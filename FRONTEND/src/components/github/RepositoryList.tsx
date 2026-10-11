import { SvgIcon } from '../icons/SvgIcon';
import type { Repository } from '../../types/github';

type Filter =
  | 'All'
  | 'Public'
  | 'Private'
  | 'Updated';

interface Props {
  repositories: Repository[];

  selectedId: string;

  query: string;

  filter: Filter;

  onQuery: (value: string) => void;

  onFilter: (value: Filter) => void;

  onSelect: (repository: Repository) => void;

  /* =======================================================
     FOCUS MODE
     ======================================================= */

  focusMode?: boolean;

  canFocus?: boolean;

  onToggleFocus?: () => void;
}

/* =========================================================
   REPOSITORY ICON TONES
   ========================================================= */

const toneClasses = [
  'tone-blue',
  'tone-cyan',
  'tone-yellow',
  'tone-purple',
  'tone-blue',
];

/* =========================================================
   LANGUAGE COLORS
   ========================================================= */

function getLanguageTone(
  language: string,
) {
  const value =
    language.toLowerCase();

  if (
    value.includes('javascript')
  ) {
    return 'yellow';
  }

  if (
    value.includes('typescript')
  ) {
    return 'blue';
  }

  if (
    value.includes('python')
  ) {
    return 'cyan';
  }

  if (
    value.includes('css')
  ) {
    return 'cyan';
  }

  if (
    value.includes('html')
  ) {
    return 'yellow';
  }

  if (
    value.includes('java')
  ) {
    return 'orange';
  }

  return 'purple';
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function RepositoryList({
  repositories,
  selectedId,
  query,
  filter,
  onQuery,
  onFilter,
  onSelect,
  focusMode = false,
  canFocus = false,
  onToggleFocus,
}: Props) {
  return (
    <section
      className="gh-panel gh-repository-panel"
      style={{
        width: '100%',
        minWidth: 0,
        minHeight: 0,
        overflow: 'hidden',

        background:
          'linear-gradient(145deg, #10274b 0%, #0b1d3a 55%, #08162e 100%)',

        border:
          '1px solid rgba(100, 160, 235, 0.18)',

        borderRadius: 24,

        boxShadow:
          '0 20px 40px rgba(0, 7, 20, 0.52), inset 2px 2px 4px rgba(255,255,255,0.05), inset -6px -8px 14px rgba(0,0,0,0.38)',

        color: '#eef4ff',
      }}
    >

      {/* ===================================================
          PANEL HEADER
          =================================================== */}

      <div
        className="gh-panel-head"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          padding:
            '20px 20px 14px',
        }}
      >

        <div>
          <h2
            style={{
              margin: 0,
              color: '#f5f8ff',
              fontSize: 24,
              lineHeight: 1.2,
              fontWeight: 700,
            }}
          >
            Repositories
          </h2>

          <p
            style={{
              margin:
                '6px 0 0',
              color: '#a9bfdf',
              fontSize: 15,
            }}
          >
            Your GitHub repositories (
            {repositories.length}
            )
          </p>
        </div>

        {/* =================================================
            FOCUS SWITCH
            ================================================= */}

        {onToggleFocus && (
          <button
            type="button"
            disabled={!canFocus}
            onClick={onToggleFocus}
            aria-label={
              focusMode
                ? 'Exit Focus mode'
                : 'Enter Focus mode'
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,

              border: 0,
              padding: 0,

              background:
                'transparent',

              color: '#dceaff',

              cursor: canFocus
                ? 'pointer'
                : 'default',

              opacity: canFocus
                ? 1
                : 0.5,

              fontFamily:
                'inherit',
            }}
          >
            <span
              style={{
                display: 'flex',
                flexDirection:
                  'column',
                alignItems:
                  'flex-end',
              }}
            >
              <strong
                style={{
                  fontSize: 15,
                  lineHeight: 1,
                }}
              >
                Focus
              </strong>

              <small
                style={{
                  marginTop: 4,
                  color: '#7994bc',
                  fontSize: 15,
                }}
              >
                Workspace
              </small>
            </span>

            <span
              style={{
                width: 60,
                height: 34,
                padding: 3,

                display: 'flex',
                alignItems: 'center',

                borderRadius: 999,

                background:
                  focusMode
                    ? 'linear-gradient(145deg, #3094ff, #1454d7)'
                    : 'linear-gradient(145deg, #12305c, #091a35)',

                border:
                  '1px solid rgba(103, 164, 239, .30)',

                boxShadow:
                  focusMode
                    ? '0 0 20px rgba(49, 137, 255, .30)'
                    : 'inset 2px 2px 4px rgba(0,0,0,.30)',
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  display: 'block',

                  borderRadius:
                    '50%',

                  transform:
                    focusMode
                      ? 'translateX(26px)'
                      : 'translateX(0)',

                  transition:
                    'transform .2s ease',

                  background:
                    'linear-gradient(145deg, #c9def9, #8eadd5)',

                  boxShadow:
                    '0 2px 6px rgba(0,0,0,.30), inset 1px 1px 2px rgba(255,255,255,.50)',
                }}
              />
            </span>
          </button>
        )}

      </div>

      {/* ===================================================
          SEARCH + FILTER
          =================================================== */}

      <div
        style={{
          padding:
            '0 20px 14px',
        }}
      >

        <label
          className="gh-repo-search"
          style={{
            width: '100%',
            height: 46,

            display: 'flex',
            alignItems: 'center',
            gap: 10,

            boxSizing:
              'border-box',

            padding:
              '0 14px',

            borderRadius: 16,

            background:
              'linear-gradient(145deg, #0d2347, #081a35)',

            border:
              '1px solid rgba(103, 161, 237, .25)',

            boxShadow:
              'inset 2px 2px 5px rgba(0,0,0,.42), inset -1px -1px 2px rgba(255,255,255,.03)',
          }}
        >
          <SvgIcon
            name="search"
            size={20}
          />

          <input
            value={query}
            onChange={(event) =>
              onQuery(
                event.target.value,
              )
            }
            placeholder="Search repositories..."
            style={{
              width: '100%',
              minWidth: 0,

              border: 0,
              outline: 0,

              background:
                'transparent',

              color: '#f2f6ff',

              fontFamily:
                'inherit',

              fontSize: 15,
            }}
          />
        </label>

        {/* FILTER BUTTONS */}

        <div
          className="gh-filter-row"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 7,
            marginTop: 10,
          }}
        >
          {(
            [
              'All',
              'Public',
              'Private',
              'Updated',
            ] as Filter[]
          ).map((item) => {
            const active =
              filter === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() =>
                  onFilter(item)
                }
                style={{
                  height: 32,
                  padding:
                    '0 13px',

                  borderRadius:
                    11,

                  border:
                    '1px solid rgba(106, 163, 235, .16)',

                  background:
                    active
                      ? 'linear-gradient(145deg, #3094ff, #1454d7)'
                      : 'linear-gradient(145deg, #142f59, #0c2141)',

                  color:
                    active
                      ? '#ffffff'
                      : '#b9cbe6',

                  fontFamily:
                    'inherit',

                  fontSize: 15,

                  fontWeight:
                    active
                      ? 700
                      : 500,

                  cursor:
                    'pointer',

                  boxShadow:
                    active
                      ? '0 8px 18px rgba(28,103,239,.32), inset 1px 1px 2px rgba(255,255,255,.22)'
                      : 'inset 1px 1px 2px rgba(255,255,255,.04), inset -2px -3px 5px rgba(0,0,0,.25)',
                }}
              >
                {item}

                {item ===
                  'Updated' &&
                  ' ▼'}
              </button>
            );
          })}
        </div>

      </div>

      {/* ===================================================
          REPOSITORY LIST
          =================================================== */}

      <div
        className="gh-repository-list"
        style={{
          display: 'flex',
          flexDirection:
            'column',

          flexWrap:
            'nowrap',

          alignItems:
            'stretch',

          gap: 8,

          padding:
            '0 20px 20px',

          maxHeight: 560,

          overflowY: 'auto',
          overflowX: 'hidden',

          /*
           * Hide scrollbar in supporting browsers.
           * The CSS pseudo-element below handles Chromium.
           */
          scrollbarWidth:
            'none',

          msOverflowStyle:
            'none',
        }}
      >

        {/* =================================================
            EMPTY STATE
            ================================================= */}

        {repositories.length ===
        0 ? (
          <div
            style={{
              minHeight: 220,

              display: 'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              flexDirection:
                'column',

              gap: 8,

              color: '#91a9cf',

              textAlign:
                'center',
            }}
          >
            <SvgIcon
              name="repo"
              size={28}
            />

            <strong
              style={{
                color:
                  '#dce8fa',
                fontSize: 15,
              }}
            >
              No repositories found
            </strong>

            <span
              style={{
                fontSize: 15,
              }}
            >
              Try changing the
              search or filter.
            </span>
          </div>
        ) : (

          /* ===============================================
             REPOSITORIES
             =============================================== */

          repositories.map(
            (
              repository,
              index,
            ) => {
              const selected =
                repository.id ===
                selectedId;

              const tone =
                toneClasses[
                  index %
                    toneClasses.length
                ];

              const languageTone =
                getLanguageTone(
                  repository.language ||
                    'Unknown',
                );

              return (
                <button
                  key={
                    repository.id
                  }
                  type="button"
                  onClick={() =>
                    onSelect(
                      repository,
                    )
                  }
                  className={
                    selected
                      ? 'gh-repository-row selected'
                      : 'gh-repository-row'
                  }
                  style={{
                    width: '100%',
                    minWidth: 0,
                    minHeight: 92,

                    display: 'grid',

                    gridTemplateColumns:
                      '44px minmax(0,1fr) auto',

                    alignItems:
                      'center',

                    gap: 12,

                    flex:
                      '0 0 auto',

                    padding:
                      '12px 13px',

                    boxSizing:
                      'border-box',

                    borderRadius:
                      18,

                    border: selected
                      ? '1px solid #45a8ff'
                      : '1px solid rgba(105, 159, 228, .13)',

                    background:
                      selected
                        ? 'linear-gradient(145deg, #1b467f, #103067 65%, #0c2248)'
                        : 'linear-gradient(145deg, #142f59, #0e2549 62%, #0b1d3b)',

                    color:
                      '#eef4ff',

                    boxShadow:
                      selected
                        ? '0 12px 24px rgba(0,77,194,.38), 0 0 18px rgba(40,142,255,.20), inset 2px 2px 3px rgba(255,255,255,.08), inset -3px -4px 7px rgba(0,0,0,.30)'
                        : '0 7px 14px rgba(0,0,0,.22), inset 1px 1px 2px rgba(255,255,255,.04), inset -2px -3px 6px rgba(0,0,0,.26)',

                    cursor:
                      'pointer',

                    textAlign:
                      'left',

                    fontFamily:
                      'inherit',

                    outline:
                      'none',
                  }}
                >

                  {/* =====================================
                      REPOSITORY ICON
                      ===================================== */}

                  <span
                    className={`gh-repo-mark ${tone}`}
                    style={{
                      width: 44,
                      height: 44,

                      display:
                        'grid',

                      placeItems:
                        'center',

                      borderRadius:
                        13,

                      flexShrink:
                        0,

                      boxShadow:
                        '0 7px 13px rgba(0,0,0,.3), inset 1px 1px 2px rgba(255,255,255,.18), inset -2px -2px 4px rgba(0,0,0,.28)',
                    }}
                  >
                    <SvgIcon
                      name="repo"
                      size={21}
                    />
                  </span>

                  {/* =====================================
                      REPOSITORY CONTENT
                      ===================================== */}

                  <span
                    style={{
                      minWidth: 0,
                      overflow:
                        'hidden',
                    }}
                  >

                    <strong
                      style={{
                        display:
                          'block',

                        color:
                          '#f4f8ff',

                        fontSize: 15,

                        lineHeight:
                          1.25,

                        whiteSpace:
                          'nowrap',

                        overflow:
                          'hidden',

                        textOverflow:
                          'ellipsis',
                      }}
                    >
                      {repository.name}
                    </strong>

                    <span
                      style={{
                        display:
                          'block',

                        marginTop: 5,

                        color:
                          '#aabedc',

                        fontSize: 15,

                        lineHeight:
                          1.35,

                        whiteSpace:
                          'nowrap',

                        overflow:
                          'hidden',

                        textOverflow:
                          'ellipsis',
                      }}
                    >
                      {repository.description ||
                        'No description provided on GitHub.'}
                    </span>

                    {/* LANGUAGE / STATS */}

                    <span
                      style={{
                        display:
                          'flex',

                        alignItems:
                          'center',

                        gap: 12,

                        marginTop: 7,

                        flexWrap:
                          'wrap',
                      }}
                    >

                      {/* LANGUAGE */}

                      <span
                        style={{
                          display:
                            'inline-flex',

                          alignItems:
                            'center',

                          gap: 6,

                          color:
                            '#d7e6fa',

                          fontSize: 15,
                        }}
                      >
                        <i
                          style={{
                            width: 10,
                            height: 10,

                            display:
                              'inline-block',

                            borderRadius:
                              '50%',

                            background:
                              languageTone ===
                              'yellow'
                                ? '#ffe147'
                                : languageTone ===
                                    'cyan'
                                  ? '#27dce6'
                                  : languageTone ===
                                      'blue'
                                    ? '#3f9eff'
                                    : '#a15cff',

                            boxShadow:
                              '0 1px 4px rgba(0,0,0,.35)',
                          }}
                        />

                        {repository.language ||
                          'Unknown'}
                      </span>

                      {/* STARS */}

                      <span
                        style={{
                          display:
                            'inline-flex',

                          alignItems:
                            'center',

                          gap: 4,

                          color:
                            '#c9d9ef',

                          fontSize: 15,
                        }}
                      >
                        <SvgIcon
                          name="star"
                          size={13}
                        />

                        {repository.stars}
                      </span>

                      {/* FORKS */}

                      <span
                        style={{
                          display:
                            'inline-flex',

                          alignItems:
                            'center',

                          gap: 4,

                          color:
                            '#c9d9ef',

                          fontSize: 15,
                        }}
                      >
                        <SvgIcon
                          name="gitbranch"
                          size={13}
                        />

                        {repository.forks}
                      </span>

                    </span>

                  </span>

                  {/* =====================================
                      STATUS
                      ===================================== */}

                  <span
                    style={{
                      minWidth: 82,

                      display:
                        'flex',

                      flexDirection:
                        'column',

                      alignItems:
                        'flex-end',

                      gap: 4,

                      textAlign:
                        'right',
                    }}
                  >

                    <span
                      style={{
                        color:
                          repository.status ===
                          'Analyzed'
                            ? '#55e7ae'
                            : repository.status ===
                                'Analyzing'
                              ? '#67b9ff'
                              : '#c0cee3',

                        fontSize: 15,

                        fontWeight: 700,

                        whiteSpace:
                          'nowrap',
                      }}
                    >
                      {repository.status}
                    </span>

                    <small
                      style={{
                        color:
                          '#89a5cf',

                        fontSize: 15,

                        whiteSpace:
                          'nowrap',
                      }}
                    >
                      {repository.updated}
                    </small>

                    <SvgIcon
                      name="chevron"
                      size={16}
                    />

                  </span>

                </button>
              );
            },
          )
        )}

      </div>

    </section>
  );
}