import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import tt from 'counterpart';
import * as userActions from 'app/redux/UserReducer';
import { actions as fetchDataSagaActions } from 'app/redux/FetchDataSaga';
import PostSummary from 'app/components/cards/PostSummary';
import Post from 'app/components/pages/Post';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import debounce from 'lodash.debounce';
import CloseButton from 'app/components/elements/CloseButton';
import { findParent } from 'app/utils/DomUtils';
import Icon from 'app/components/elements/Icon';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import ImpRecorder from "app/components/elements/ImpRecorder/ImpRecorder";
function topPosition(domElt) {
    if (!domElt) {
        return 0;
    }
    return domElt.offsetTop + topPosition(domElt.offsetParent);
}

class PostsList extends React.Component {
    static propTypes = {
        posts: PropTypes.object.isRequired,
        loading: PropTypes.bool.isRequired,
        category: PropTypes.string,
        loadMore: PropTypes.func,
        showSpam: PropTypes.bool,
        showRevoilk: PropTypes.bool,
        fetchState: PropTypes.func.isRequired,
        pathname: PropTypes.string,
        nsfwPref: PropTypes.string.isRequired,
    };

    static defaultProps = {
        showSpam: false,
        loading: false,
    };

    constructor() {
        super();
        this.state = {
            thumbSize: 'desktop',
            showNegativeComments: false,
        };
        this.scrollListener = this.scrollListener.bind(this);
        this.onBackButton = this.onBackButton.bind(this);
        this.closeOnOutsideClick = this.closeOnOutsideClick.bind(this);
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'PostsList');
    }

    componentDidMount() {
        this.attachScrollListener();
    }

    componentWillUnmount() {
        this.detachScrollListener();
        window.removeEventListener('popstate', this.onBackButton);
        window.removeEventListener('keydown', this.onBackButton);
        const post_overlay = document.getElementById('post_overlay');
        if (post_overlay)
            post_overlay.removeEventListener('click', this.closeOnOutsideClick);
        document.getElementsByTagName('body')[0].className = '';
    }

    onBackButton(e) {
        if ('keyCode' in e && e.keyCode !== 27) return;
        window.removeEventListener('popstate', this.onBackButton);
        window.removeEventListener('keydown', this.onBackButton);
    }

    closeOnOutsideClick(e) {
        const inside_post = findParent(e.target, 'PostsList__post_container');
        if (!inside_post) {
            const inside_top_bar = findParent(
                e.target,
                'PostsList__post_top_bar'
            );
            if (!inside_top_bar) {
                const post_overlay = document.getElementById('post_overlay');
                if (post_overlay)
                    post_overlay.removeEventListener(
                        'click',
                        this.closeOnOutsideClick
                    );
                this.closePostModal();
            }
        }
    }

    fetchIfNeeded() {
        this.scrollListener();
    }

    toggleNegativeReplies = () => {
        this.setState({
            showNegativeComments: !this.state.showNegativeComments,
        });
    };

    scrollListener = debounce(() => {
        const el = window.document.getElementById('posts_list');
        if (!el) return;
        const scrollTop =
            window.pageYOffset !== undefined
                ? window.pageYOffset
                : (
                      document.documentElement ||
                      document.body.parentNode ||
                      document.body
                  ).scrollTop;
        if (
            topPosition(el) + el.offsetHeight - scrollTop - window.innerHeight <
            10
        ) {
            const { loadMore, posts, category, showRevoilk } = this.props;
            if (loadMore && posts && posts.size)
                loadMore(posts.last(), category, showRevoilk);
        }
        // Detect if we're in mobile mode (renders larger preview imgs)
        const mq = window.matchMedia('screen and (max-width: 39.9375em)');
        if (mq.matches) {
            this.setState({ thumbSize: 'mobile' });
        } else {
            this.setState({ thumbSize: 'desktop' });
        }
    }, 150);

    attachScrollListener() {
        window.addEventListener('scroll', this.scrollListener, {
            capture: false,
            passive: true,
        });
        window.addEventListener('resize', this.scrollListener, {
            capture: false,
            passive: true,
        });
        this.scrollListener();
    }

    detachScrollListener() {
        window.removeEventListener('scroll', this.scrollListener);
        window.removeEventListener('resize', this.scrollListener);
    }

    render() {
        const {
            posts,
            showPinned,
            showRevoilk,
            showSpam,
            loading,
            category,
            content,
            ignore_result,
            account,
            nsfwPref,
        } = this.props;
        const { thumbSize } = this.state;
        const postsInfo = [];
        posts.forEach(item => {
            const cont = content.get(item);
            if (!cont) {
                console.error('PostsList --> Missing cont key', item);
                return;
            }
            const ignore =
                ignore_result && ignore_result.has(cont.get('author'));
            const hideRevoilk =
                !showRevoilk && account && cont.get('author') != account;
            const hide = cont.getIn(['stats', 'hide']);
            if (!hideRevoilk && (!(ignore || hide) || showSpam))
                // rephide
                postsInfo.push({ item, ignore });
        });
        const pinned = this.props.pinned.toJS();
        const renderPinned = pinnedPosts =>
            pinnedPosts.map(pinnedPost => (
                <li key={pinnedPost}>
                    <div className="PinLabel">
                        <Icon className="PinIcon" name="pin" />{' '}
                        <span className="PinText">Pinned Post</span>
                    </div>
                    <PostSummary
                        account={account}
                        post={`${pinnedPost.author}/${pinnedPost.permlink}`}
                        thumbSize={thumbSize}
                        ignore={false}
                        nsfwPref={nsfwPref}
                    />
                </li>
            ));
        const renderSummary = items =>
            items.map(item => (
                <li key={item.item}>
                    <PostSummary
                        account={account}
                        post={item.item}
                        thumbSize={thumbSize}
                        ignore={item.ignore}
                        nsfwPref={nsfwPref}
                    />
                </li>
            ));

        return (
            <div id="posts_list" className="PostsList">
                <ImpRecorder 
                    classPref="ads-rotator" // class???????????????class?????????????????????
                    interval={5000}      // ????????????
                    hoverDelay={600}      // ????????????????????????????????????
                    lockTimeout={600}
                    adtype={"large"}   // ???????????????frame??????????????????????????????????????????????????????
                />
                <ul
                    className="PostsList__summaries hfeed"
                    itemScope
                    itemType="http://schema.org/blogPosts"
                >
                    {/* Only render pinned posts when other posts are ready */}
                    {showPinned && postsInfo.length > 0 && renderPinned(pinned)}
                    {renderSummary(postsInfo)}
                </ul>
                {loading && (
                    <center>
                        <LoadingIndicator
                            style={{ marginBottom: '2rem' }}
                            type="circle"
                        />
                    </center>
                )}
            </div>
        );
    }
}

export default connect(
    (state, props) => {
        const pathname = state.app.get('location').pathname;
        const current = state.user.get('current');
        const username = current
            ? current.get('username')
            : state.offchain.get('account');
        const content = state.global.get('content');
        const ignore_result = state.global.getIn([
            'follow',
            'getFollowingAsync',
            username,
            'ignore_result',
        ]);
        const userPreferences = state.app.get('user_preferences').toJS();
        const nsfwPref = userPreferences.nsfwPref || 'warn';
        const pinned = state.offchain.get('pinned_posts');
        return {
            ...props,
            username,
            content,
            ignore_result,
            pathname,
            nsfwPref,
            pinned,
        };
    },
    dispatch => ({
        fetchState: pathname => {
            dispatch(fetchDataSagaActions.fetchState({ pathname }));
        },
        removeHighSecurityKeys: () => {
            dispatch(userActions.removeHighSecurityKeys());
        },
    })
)(PostsList);
